import type { ClientConnection } from '@server/connect/ClientConnection'
import type { ServerActionExecution } from '@server/missions/actions/ServerActionExecution'
import type { ServerExecutionOutcome } from '@server/missions/actions/ServerExecutionOutcome'
import type { ServerMissionAction } from '@server/missions/actions/ServerMissionAction'
import type { ServerEffect } from '@server/missions/effects/ServerEffect'
import type { ServerMissionForce } from '@server/missions/forces/ServerMissionForce'
import type { ServerMission } from '@server/missions/ServerMission'
import { OutdatedContextError } from '@server/target-environments/context/OutdatedContextError'
import type {
  TargetEnvContext,
  TTargetEnvExposedSession,
  TTargetEnvExposedSessionConfig,
} from '@server/target-environments/context/TargetEnvContext'
import { TargetScriptContext } from '@server/target-environments/context/TargetScriptContext'
import { ServerEnvironmentTask } from '@server/target-environments/ServerEnvironmentTask'
import type { ServerTargetEnvironment } from '@server/target-environments/ServerTargetEnvironment'
import type { ServerUser } from '@server/users/ServerUser'
import type {
  TClientEvents,
  TRequestEvents,
  TRequestOfResponse,
  TServerEvents,
  TServerMethod,
  TSessionPanelAlert,
} from '@shared/connect'
import { ServerEmittedError } from '@shared/connect/errors/ServerEmittedError'
import type {
  TEffectExecutionTriggered,
  TEffectSessionTriggered,
  TEffectTrigger,
  TEffectType,
} from '@shared/missions/effects/Effect'
import type { TMissionJsonOptions } from '@shared/missions/Mission'
import type { TChatChannelJson } from '@shared/sessions/chat/ChatChannel'
import type { TSessionAuthParam } from '@shared/sessions/members/MemberPermission'
import type {
  MemberRole,
  TMemberRoleId,
} from '@shared/sessions/members/MemberRole'
import type { TSessionMemberJson } from '@shared/sessions/members/SessionMember'
import type {
  TSessionBasicJson,
  TSessionConfig,
  TSessionJson,
  TSessionState,
} from '@shared/sessions/MissionSession'
import { MissionSession } from '@shared/sessions/MissionSession'
import type { TSessionRealmJson } from '@shared/sessions/SessionRealm'
import type {
  TEnvironmentTaskJson,
  TEnvironmentTaskSource,
} from '@shared/target-environments/TargetEnvironmentTask'
import type { TInstanceOrArray } from '@shared/toolbox/arrays/ArrayToolbox'
import { ArrayToolbox } from '@shared/toolbox/arrays/ArrayToolbox'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import type { User } from '@shared/users/User'
import { targetEnvLogger } from '../logging'
import type { ServerChatChannel } from './chat/ServerChatChannel'
import { ServerSessionMember } from './ServerSessionMember'
import type { TServerRealmJsonOptions } from './ServerSessionRealm'
import { ServerSessionRealm } from './ServerSessionRealm'
import { TargetEnvStore } from './TargetEnvStore'
import { onAcknowledgeSessionPanelAlert } from './traffic-controllers/onAcknowledgeSessionPanelAlert'
import { onFetchSessionPanelAlerts } from './traffic-controllers/onFetchSessionPanelAlerts'
import { onRequestAcknowledgeNodeAlert } from './traffic-controllers/onRequestAcknowledgeNodeAlert'
import { onRequestAssignForce } from './traffic-controllers/onRequestAssignForce'
import { onRequestAssignRole } from './traffic-controllers/onRequestAssignRole'
import { onRequestBan } from './traffic-controllers/onRequestBan'
import { onRequestConfigUpdate } from './traffic-controllers/onRequestConfigUpdate'
import { onRequestEndSession } from './traffic-controllers/onRequestEndSession'
import { onRequestExecuteAction } from './traffic-controllers/onRequestExecuteAction'
import { onRequestKick } from './traffic-controllers/onRequestKick'
import { onRequestOpenNode } from './traffic-controllers/onRequestOpenNode'
import { onRequestResetSession } from './traffic-controllers/onRequestResetSession'
import { onRequestSendChatMessage } from './traffic-controllers/onRequestSendChatMessage'
import { onRequestSendOutput } from './traffic-controllers/onRequestSendOutput'
import { onRequestStartSession } from './traffic-controllers/onRequestStartSession'
import { onRequestUnban } from './traffic-controllers/onRequestUnban'

/**
 * Server instance for sessions. Handles server-side logic for a session with participating clients. Communicates with clients to conduct the session.
 */
export class SessionServer extends MissionSession<TMetisServerComponents> {
  /**
   * @see {@link instanceId}.
   */
  protected _instanceId: string

  /**
   * An identifier with higher specifity in comparison to {@link _id}.
   * This ID will be updated upon session reset. However, the {@link _id}
   * remains constant until the session is destroyed.
   */
  public get instanceId(): string {
    return this._instanceId
  }

  // Overridden.
  public get state() {
    return this._state
  }

  /**
   * Whether the session has been destroyed.
   */
  private _destroyed: boolean

  /**
   * Whether the session has been destroyed.
   */
  public get destroyed(): boolean {
    return this._destroyed
  }

  /**
   * Private cache for {@link defaultRealm}.
   */
  private _defaultRealm?: ServerSessionRealm
  // Implemented
  public get defaultRealm(): ServerSessionRealm {
    if (!this._defaultRealm) {
      this._defaultRealm = ServerSessionRealm.createNew(
        MissionSession.DEFAULT_REALM_NAME,
        this,
        { _id: MissionSession.DEFAULT_REALM_ID, missionMintOptions: 'blank' },
      )
    }
    return this._defaultRealm
  }

  /**
   * Clean up functions created by the {@link TargetEnvContext.sleep} method.
   */
  private sleepCleanUps: Set<() => void>

  /**
   * A timeline of effect promises that have been
   * applied in the session. This can be used during
   * teardown to ensure all effects resolve before
   * performing teardown operations.
   */
  private effectHistory: Promise<void>[]

  /**
   * Tracks which session panel tabs have pending (unacknowledged) alerts
   * per member.
   */
  protected _pendingSessionPanelAlerts = new Map<
    string,
    Set<TSessionPanelAlert>
  >()

  /**
   * Unread chat message counts per member per channel.
   * @example
   * ```typescript
   * private _unreadChatChannelMessages = new Map<memberId, Map<channelId, unreadChatMessageCount>>()
   * ```
   */
  private _unreadChatChannelMessages = new Map<string, Map<string, number>>()

  /**
   * This is a registry, not of active listeners, but the
   * methods and corresponding handlers for all listeners
   * that should be added and removed via the {@link addListeners}
   * and {@link removeListeners} methods. This helps ensure
   * there is no mismatch in adding and removing listeners,
   * such as adding a listener and forgetting to remove it,
   * or vice versa.
   */
  private get listenerInputRegistry() {
    return [
      ['request-start-session', onRequestStartSession],
      ['request-end-session', onRequestEndSession],
      ['request-reset-session', onRequestResetSession],
      ['request-config-update', onRequestConfigUpdate],
      ['request-kick', onRequestKick],
      ['request-ban', onRequestBan],
      ['request-unban', onRequestUnban],
      ['request-assign-force', onRequestAssignForce],
      ['request-assign-role', onRequestAssignRole],
      ['request-open-node', onRequestOpenNode],
      ['request-execute-action', onRequestExecuteAction],
      ['request-send-output', onRequestSendOutput],
      ['request-acknowledge-node-alert', onRequestAcknowledgeNodeAlert],
      ['request-send-chat-message', onRequestSendChatMessage],
      ['acknowledge-session-panel-alert', onAcknowledgeSessionPanelAlert],
      ['fetch-session-panel-alerts', onFetchSessionPanelAlerts],
    ] as const
  }

  public constructor(
    _id: string,
    name: string,
    owner: ServerUser,
    config: Partial<TSessionConfig>,
    mission: ServerMission,
  ) {
    super(
      _id,
      name,
      owner._id,
      owner.username,
      owner.firstName,
      owner.lastName,
      new Date(),
      config,
      mission,
      [],
      [],
      [],
      [],
    )
    this._instanceId = StringToolbox.generateRandomId()
    this._state = 'unstarted'
    this._destroyed = false
    this.register()
    this.sleepCleanUps = new Set<() => void>()
    this.effectHistory = []
  }

  // Implemented
  protected parseRealmData(_data: TSessionRealmJson[]): ServerSessionRealm[] {
    // Returns empty array; the server mints realms dynamically on start/reset.
    return []
  }

  // Implemented
  protected parseMemberData(data: TSessionMemberJson[]): ServerSessionMember[] {
    // Returns empty array, since the data
    // should never need to be parsed.
    return []
  }

  // Implemented
  protected parseEnvironmentTaskData(
    _data: TEnvironmentTaskJson[],
  ): ServerEnvironmentTask[] {
    // Returns empty array; the server generates tasks dynamically as they run.
    return []
  }

  // Implemented
  protected parseChatChannelData(
    _data: TChatChannelJson[],
  ): ServerChatChannel[] {
    // Returns empty array; the server creates channels dynamically on start/reset.
    return []
  }

  /**
   * @param forceId The ID of the force for which to retrieve members.
   * @param realmId The ID of the realm to which returned members must
   * be subscribed.
   * @param options Additional options to tailor the members returned based on
   * the callers needs.
   * @returns the members of the session which have visibility of the force
   * with the given ID. List will be further refined based on any additional
   * options provided.
   */
  public getMembersForForce(
    forceId: string,
    realmId: string,
    options: TMembersForForceOptions = {},
  ): ServerSessionMember[] {
    const { limitedVisibilityOnly = false } = options

    // Get all members that either have complete visibility
    // or are assigned to the force with the given ID.
    return this.members.filter((member) => {
      let hasCompleteVisibility = member.isAuthorized('completeVisibility')
      let isAssignedToForce = member.assignedForceId === forceId
      let isSubscribedToRealm = member.subscribedRealmId === realmId

      if (limitedVisibilityOnly) {
        return (
          isAssignedToForce && !hasCompleteVisibility && isSubscribedToRealm
        )
      } else {
        return (
          (isAssignedToForce || hasCompleteVisibility) && isSubscribedToRealm
        )
      }
    })
  }

  /**
   * @param permissions The permission(s) to check for.
   * @returns The members with the specified permission(s).
   */
  public getMembersWithPermissions(
    permissions: TSessionAuthParam,
  ): ServerSessionMember[] {
    return this.members.filter((member) => member.isAuthorized(permissions))
  }

  /**
   * Returns the chat channels that the given member is allowed to see.
   * @param member The session member to filter channels for.
   * @returns The channels visible to the member.
   */
  public getVisibleChannels(member: ServerSessionMember): ServerChatChannel[] {
    return this._chatChannels.filter((c) => c.canMemberSee(member))
  }

  /**
   * @returns The properties from the session that are
   * safe to expose in target-environment code.
   */
  public toTargetEnvContext(
    environment: ServerTargetEnvironment,
  ): TTargetEnvExposedSession {
    const self = this
    return {
      _id: self._id,
      name: self.name,
      state: self.state,
      config: self.configToTargetEnvContext(environment),
      launchedAt: structuredClone(self.launchedAt),
      get members() {
        return self.members.map((member) => member.toTargetEnvContext())
      },
      get joinedMembers() {
        return self.joinedMembers.map((member) => member.toTargetEnvContext())
      },
      get participants() {
        return self.participants.map((member) => member.toTargetEnvContext())
      },
      get observers() {
        return self.observers.map((member) => member.toTargetEnvContext())
      },
      get managers() {
        return self.managers.map((member) => member.toTargetEnvContext())
      },
    }
  }

  /**
   * @param environment The config will be populated in an
   * environment-specific manner, so this is needed.
   * @returns The properties from the session config
   * that are safe to expose in target-environment code.
   */
  public configToTargetEnvContext(
    environment: ServerTargetEnvironment,
  ): TTargetEnvExposedSessionConfig {
    const self = this
    return {
      name: this.config.name,
      accessibility: this.config.accessibility,
      infiniteResources: this.config.infiniteResources,
      get targetEnvConfig() {
        let configId: string | undefined =
          self.config.targetEnvConfigs[environment._id]
        if (!configId) return null
        return environment.configs.find(({ _id }) => _id === configId) ?? null
      },
    }
  }

  // Implemented
  public toJson(options: TSessionServerJsonOptions = {}): TSessionJson {
    // Gather details.
    const { requester } = options
    let realmOptions: TMissionJsonOptions = {
      forceExposure: { expose: 'none' },
      fileExposure: { expose: 'none' },
      sessionDataExposure: { expose: 'all' },
      rootEffectsExposure: { expose: 'none' },
    }
    let environmentTasks: TEnvironmentTaskJson[] = []
    let chatChannels: TChatChannelJson[] = []
    let pendingSessionPanelAlerts: TSessionPanelAlert[] = []
    let unreadChatChannelMessages: Record<string, number> = {}
    let realms: TSessionRealmJson[] = []

    // Handler a requester being passed.
    if (requester) {
      // Gather details.
      let { assignedForceId: forceId } = requester

      // Update the session-data exposure to be user
      // specific to the requester.
      realmOptions.sessionDataExposure = {
        expose: 'member-specific',
        memberId: requester._id,
      }

      // If the requester is assigned to a force,
      // then update the mission options to include
      // data pertinent to the force.
      if (forceId) {
        realmOptions.forceExposure = {
          expose: 'force-with-revealed-nodes',
          forceId,
        }
        realmOptions.fileExposure = {
          expose: 'accessible',
          forceId,
        }
      }

      // If the requester has complete visibility,
      // then update the mission options to expose
      // all force data and file data.
      if (requester.isAuthorized('completeVisibility')) {
        realmOptions.forceExposure = { expose: 'all' }
        realmOptions.fileExposure = { expose: 'all' }
      }

      // If the requester is authorized to view target environment
      // results, then include the tasks.
      if (requester.isAuthorized('viewTargetEnvironmentTasks')) {
        environmentTasks = this.environmentTasks.map((task) => task.toJson())
      }

      // Grab the chat channels visible to the requester.
      chatChannels = this.getVisibleChannels(requester).map((channel) =>
        channel.toJson(),
      )

      // Grab all pending session panel alerts for the requester.
      pendingSessionPanelAlerts = [
        ...(this._pendingSessionPanelAlerts.get(requester._id) ?? []),
      ]

      // Grab all unread chat channel messages for the requester.
      unreadChatChannelMessages = Object.fromEntries(
        this._unreadChatChannelMessages.get(requester._id) ?? new Map(),
      )

      // Include subscribed realm if it is not the default realm.
      if (requester.subscribedRealm !== this.defaultRealm) {
        realms.push(requester.subscribedRealm.toJson(realmOptions))
      }
    }

    // Construct JSON.
    let json: TSessionJson = {
      _id: this._id,
      state: this.state,
      name: this.name,
      ownerId: this.ownerId,
      ownerUsername: this.ownerUsername,
      ownerFirstName: this.ownerFirstName,
      ownerLastName: this.ownerLastName,
      launchedAt: this.launchedAt.toISOString(),
      mission: this.mission.toExistingJson(realmOptions),
      realms,
      members: this._members.map((member) => member.toJson()),
      config: this.config,
      environmentTasks,
      chatChannels,
      unreadChatChannelMessages,
      pendingSessionPanelAlerts,
    }

    return json
  }

  // Implemented
  public toBasicJson(
    options: TSessionServerBasicJsonOptions = {},
  ): TSessionBasicJson {
    // Gather details.
    const { requester } = options
    let setupFailed: boolean = false
    let teardownFailed: boolean = false

    // If the requester is authorized to write
    // to sessions, include the ban list.
    if (requester?.isAuthorized('sessions_write_native')) {
      setupFailed = this.setupFailed
      teardownFailed = this.teardownFailed
    }

    // Construct and return JSON.
    return {
      _id: this._id,
      missionId: this.missionId,
      state: this.state,
      name: this.name,
      ownerId: this.ownerId,
      ownerUsername: this.ownerUsername,
      ownerFirstName: this.ownerFirstName,
      ownerLastName: this.ownerLastName,
      launchedAt: this.launchedAt.toISOString(),
      config: this.config,
      participantIds: this.participants.map(({ userId: userId }) => userId),
      observerIds: this.observers.map(({ userId: userId }) => userId),
      managerIds: this.managers.map(({ userId: userId }) => userId),
      joinedMemberCount: this.joinedMembers.length,
      setupFailed,
      teardownFailed,
    }
  }

  /**
   * Gets the role of the given user in the session.
   */
  public getRole(userId: User['_id']): MemberRole | undefined {
    return this.getMemberByUserId(userId)?.role
  }

  /**
   * Adds this session into the registry, indexing it with its session ID.
   */
  private register(): void {
    SessionServer.registry.set(this._id, this)
  }

  /**
   * Removes this session from the registry.
   */
  private unregister(): void {
    SessionServer.registry.delete(this._id)
  }

  /**
   * Handles any actions that are executing on a node.
   */
  private async abortExecutions(): Promise<void> {
    return new Promise<void>(async (resolve) => {
      let allExecutions: Promise<void>[] = []

      this.mission.allNodes.forEach((node) => {
        if (node.executing) {
          let execution = node.latestExecution!
          execution.abort()

          // Once the execution is aborted, push a promise
          // to the array of all executions.
          execution.addEventListener('aborted', () => {
            allExecutions.push(new Promise((resolve) => resolve()))
          })
        }
      })

      // If there are no executions, resolve.
      if (allExecutions.length === 0) resolve()
      // Resolve all executions.
      await Promise.all(allExecutions)
      resolve()
    })
  }

  /**
   * Destroys the session.
   */
  public destroy(): void {
    this.unregister()
    this._destroyed = true
    TargetEnvStore.cleanUp(this._id)

    for (let member of this.joinedMembers) {
      member.emit('session-destroyed', { data: { sessionId: this._id } })
    }
    this.clearMembers()
  }

  /**
   * Sets up the session for use, including all registered
   * target environments in the mission.
   * @resolves When session setup is complete.
   * @rejects If the setup fails.
   */
  public async setUp(): Promise<void> {
    // ! For setup, hooks go first, then effects.
    // ! The order matters here. The hooks sandwich
    // ! the effects in terms of order of operations
    // ! for setup and teardown.

    // Get the target environments that the
    // mission of the given session uses.
    let environments = this.mission.targetEnvironments
    let setUpPromises: Promise<void>[] = []

    for (let realm of this.realms) {
      // For each target environment in the registry, set it up.
      for (let environment of environments) {
        if (this.config.disabledTargetEnvs.includes(environment._id)) {
          continue
        }
        // Run the target-environment setup hooks. Each execution
        // records and broadcasts itself as it progresses.
        let promise = environment.setUp(realm)
        // Store the promise, for awaiting later.
        setUpPromises.push(promise)
      }
    }

    // Await all environment setups.
    await Promise.all(setUpPromises)

    // If there were setup errors, do not proceed.
    if (this.setupFailed) return

    await this.applyMissionEffects('session-setup')
  }

  /**
   * Tears down the session, including all registered
   * target environments in the mission.
   * @resolves When session teardown is complete.
   * @rejects If the teardown fails.
   */
  public async tearDown(): Promise<void> {
    // Perform standard cleanup
    await this.abortExecutions()
    this.cleanUpSleepCalls() // This must precede effect clean up.
    await this.cleanUpEffects()

    // ! For teardown, effects go first, then hooks.
    // ! The order matters here. The hooks sandwich
    // ! the effects in terms of order of operations
    // ! for setup and teardown.

    // Apply mission effects purposed for session teardown.
    await this.applyMissionEffects('session-teardown')

    // If there were teardown errors, do not proceed.
    if (this.teardownFailed) return

    // Get the target environments that the
    // mission of the given session uses.
    let environments = this.mission.targetEnvironments
    let tearDownPromises: Promise<void>[] = []

    for (let realm of this.realms) {
      // For each target environment in the registry, tear it down.
      for (let environment of environments) {
        if (this.config.disabledTargetEnvs.includes(environment._id)) {
          continue
        }
        // Run the target-environment teardown hooks. Each execution
        // records and broadcasts itself as it progresses.
        let promise = environment.tearDown(realm)
        // Store the promise, for awaiting later.
        tearDownPromises.push(promise)
      }
    }

    // Await all environment teardowns.
    await Promise.all(tearDownPromises)
  }

  /**
   * Calls clean up functions stored in {@link sleepCleanUps}
   * and clears the set.
   */
  private cleanUpSleepCalls(): void {
    this.sleepCleanUps.forEach((cleanUp) => cleanUp())
    this.sleepCleanUps.clear()
  }

  /**
   * Ensures all effect promises settle as a part
   * of the clean up process. This ensures nothing
   * resolves after the session is finished cleaning
   * up.
   */
  private async cleanUpEffects(): Promise<void> {
    await Promise.allSettled(this.effectHistory)
    this.effectHistory = []
  }

  /**
   * Deletes all members from the session.
   */
  public clearMembers(): void {
    // Remove all joined members from the session by forcing each to quit.
    // Ghost members have no live connection, so they are skipped here.
    this.joinedMembers.forEach((member) => member.leave())
    // Clear member list.
    this._members = []
  }

  /**
   * Has the given client connection join as a member of the session.
   * @param client The user joining the session.
   * @returns The new `ServerSessionMember` object that was created.
   * @throws The server emitted error code of any error that occurs.
   * @note Establishes listeners to handle events emitted by the user's web socket connection.
   */
  public join(client: ClientConnection): ServerSessionMember {
    let userId = client.userId
    let isUnstarted = this._state === 'unstarted'

    // Throw error if the user is already joined in the session.
    if (this.isJoined(userId)) {
      throw ServerEmittedError.CODE_ALREADY_IN_SESSION
    }

    // Reactivate an existing ghost member (one who quit but retained an
    // assignment) if present, otherwise create a brand-new member.
    let ghostMember = this._members.find((member) => member.userId === userId)
    let member = ghostMember ?? ServerSessionMember.createNew(client, this)
    let hasCompleteVisibility = member.isAuthorized('completeVisibility')
    let isAssignedToForce = member.isAssignedToForce

    // Throw error if the member is marked as banned.
    if (member.banned) {
      throw ServerEmittedError.CODE_SESSION_BANNED
    }
    // If the member has been assigned a role that denies
    // access, throw an error.
    if (member.roleId === 'access_denied') {
      throw ServerEmittedError.CODE_SESSION_UNAUTHORIZED_JOIN
    }
    // If the session is already starting/started, ensure that
    // the member has visibility to at least one force.
    if (!isUnstarted && !hasCompleteVisibility && !isAssignedToForce) {
      throw ServerEmittedError.CODE_SESSION_LATE_JOIN
    }

    // Push the member to the list of members if they are newly created.
    if (!ghostMember) this._members.push(member)
    // Rejoin with new client otherwise.
    else ghostMember.rejoin(client)

    // Add event listeners for the member.
    this.addListeners(member)

    // Subscribe the member to the first realm available
    // if they are currently subscribed to the default realm.
    if (
      member.subscribedRealmId === SessionServer.DEFAULT_REALM_ID &&
      this._realms.length
    ) {
      member.subscribeToRealm(this._realms[0])
    }

    // Handle joining the session for the client.
    client.login.onMetisSessionJoin(this._id)

    // Emit an event to all users that the user list
    // has changed.
    this.emitToAll('session-members-updated', {
      data: {
        members: this.members.map((member) => member.toJson()),
      },
    })

    // Return the new member.
    return member
  }

  /**
   * Handles a new connection by an existing member.
   * @param newConnection The new connection for a member of the session.
   * @returns True if connection was replaced, false if the member wasn't found.
   */
  public handleConnectionChange(newConnection: ClientConnection): boolean {
    // Find the member.
    let member = this._members.find(
      ({ userId }) => userId === newConnection.userId,
    )
    // If the member is found, update the connection.
    if (member) {
      this.removeListeners(member)
      member.rejoin(newConnection)
      this.addListeners(member)

      // Make sure the client's pending session panel alerts are in sync
      // with the server's pending session panel alerts upon reconnect.
      const pending = this._pendingSessionPanelAlerts.get(member._id)
      if (pending?.size) {
        member.emit('session-panel-alert', { data: { panels: [...pending] } })
      }
    }
    // Return whether the member was found.
    return !!member
  }

  /**
   * Has the given user (participant or observer) quit the session.
   * @param userId The ID of the user quiting the session.
   * @note Removes any session listeners for the user.
   * @note A member who retains a force or realm assignment is kept
   * as a ghost (marked as no longer joined) so managers can still see
   * them and their assignment is restored on rejoin; otherwise they
   * are removed.
   */
  public quit(userId: string): void {
    // Find the member that quit, if present.
    let member = this._members.find((member) => member.userId === userId)
    if (!member) return

    // If the session is for testing, then tear it down and destroy it.
    if (this.config.accessibility === 'testing') {
      this._state = 'ending'
      this.tearDown().then(() => {
        // If there were teardown errors, do not proceed.
        if (this.teardownFailed) return
        this._state = 'ended'
        this.destroy()
      })
    }

    member.leave()

    // Emit an event to all users that the user list
    // has changed.
    this.emitToAll('session-members-updated', {
      data: {
        members: this.members.map((member) => member.toJson()),
      },
    })
  }

  /**
   * Spawns one realm per participant/participant-observer for a
   * single-player session, each containing only the configured
   * force, and assigns each member to their realm.
   */
  private spawnSinglePlayerRealms(): void {
    let singlePlayerForceId = this.config.singlePlayerForceId
    if (!singlePlayerForceId) {
      throw new Error(
        'Cannot mint single-player realms without a configured force.',
      )
    }

    this._realms = []

    for (let member of this.members) {
      // Only participants and participant-observers are
      // assigned to a dedicated realm. Other members
      // observe everything.
      if (!member.isAuthorized('forceAssignable') || member.banned) continue

      let realm = ServerSessionRealm.createNew(member.username, this, {
        missionMintOptions: {
          forceExposure: {
            expose: 'force-with-all-nodes',
            forceId: singlePlayerForceId,
          },
          fileExposure: { expose: 'all' },
          rootEffectsExposure: { expose: 'all' },
        },
      })

      member.assignToForce(singlePlayerForceId)
      member.assignToRealm(realm._id)
      member.subscribeToRealm(realm)

      this._realms.push(realm)
    }

    // Managers and other complete-visibility members observe the
    // first participant's realm.
    this.subscribeCompleteVisibilityMembers()
  }

  /**
   * Spawns the single shared realm for a multiplayer session.
   * @note The realm is the sole realm subscribed to by all members
   * in multiplayer mode.
   */
  private spawnMultiplayerRealm(): void {
    let realm = ServerSessionRealm.createNew(this.name, this)
    this._realms = [realm]

    // Participants are assigned to and share the single realm.
    for (let member of this.members) {
      if (member.isAuthorized('forceAssignable') && !member.banned) {
        member.assignToRealm(realm)
        member.subscribeToRealm(realm)
      }
    }

    // Managers and other complete-visibility members observe it.
    this.subscribeCompleteVisibilityMembers()
  }

  /**
   * Sets up the session to function in the configured mode,
   * creating mode-specific realms and enforcing any mode-specific
   * restrictions on the session configuration.
   */
  protected initializeMode(): void {
    // Create the realms now that the participant roster is known. In
    // single-player this is one realm per participant (which also
    // assigns every participant a force/realm, so the dismissal check
    // below treats them as assigned); in multiplayer it is the single
    // shared realm.
    if (this.config.mode === 'single-player') {
      this.spawnSinglePlayerRealms()
      this.enforceSinglePlayerTargetEnvs()
    } else {
      this.spawnMultiplayerRealm()
    }
  }

  /**
   * Subscribes every complete-visibility member (e.g. managers) to the
   * first realm in the session so they observe live gameplay rather
   * than the blank fallback realm.
   * @note A no-op when the session has no realms.
   */
  private subscribeCompleteVisibilityMembers(): void {
    let realm = this._realms[0]
    if (!realm) return
    for (let member of this.members) {
      if (member.isAuthorized('completeVisibility')) {
        member.subscribeToRealm(realm)
      }
    }
  }

  /**
   * Resets the gameplay state within every existing realm in place,
   * rebuilding each realm's mission from its own pristine save JSON and
   * re-establishing initial runtime state.
   * @note Realms are not recreated, so realm identity and member
   * subscriptions are preserved and no reassignment is required.
   */
  protected resetRealms(): void {
    this.realms.forEach((realm) => realm.reset())
  }

  /**
   * Removes the given member(s) from the session list.
   * @param members The member(s) to remove from the session.
   */
  public removeMembers(members: TInstanceOrArray<ServerSessionMember>): void {
    members = ArrayToolbox.toArray(members)
    this._members = this._members.filter(
      ({ _id }) => !members.some((member) => member._id === _id),
    )
  }

  /**
   * In single-player mode, locks every target environment used by the
   * mission that does not support multiple realms into the disabled
   * list. This prevents unsupported environments from colliding
   * across the per-participant realms running simultaneously.
   * @note A no-op outside single-player mode.
   */
  private enforceSinglePlayerTargetEnvs(): void {
    if (this.config.mode !== 'single-player') return

    let disabled = new Set(this._config.disabledTargetEnvs)
    for (let environment of this.mission.targetEnvironments) {
      if (!environment.multiRealmSupport) {
        disabled.add(environment._id)
      }
    }
    this._config.disabledTargetEnvs = [...disabled]
  }

  /**
   * Creates session-specific listeners for the given member.
   */
  private addListeners(member: ServerSessionMember): void {
    this.listenerInputRegistry.forEach(([method, handler]) => {
      member.connection?.addEventListener(method, (event: any) =>
        handler(member, event),
      )
    })
  }

  /**
   * Removes session-specific listeners for the given participant.
   */
  private removeListeners(member: ServerSessionMember): void {
    member.connection?.clearEventListeners(
      this.listenerInputRegistry.map(([method]) => method),
    )
  }

  /**
   * Emits an event to all the members joined in the session.
   * @param method The method of the event to emit.
   * @param payload The payload of the event to emit.
   */
  public emitToAll<
    TMethod extends TServerMethod,
    TPayload extends Omit<TServerEvents[TMethod], 'method'>,
  >(method: TMethod, payload: TPayload): void {
    for (let member of this.joinedMembers) member.emit(method, payload)
  }

  /**
   * Emits an event to all members with the given role.
   * @param roleId The ID of the role to emit to.
   * @param method The method of the event to emit.
   * @param payload The payload of the event to emit.
   */
  public emitToRole<
    TMethod extends TServerMethod,
    TPayload extends Omit<TServerEvents[TMethod], 'method'>,
  >(roleId: TMemberRoleId, method: TMethod, payload: TPayload): void {
    for (let member of this.joinedMembers) {
      if (member.role._id === roleId) member.emit(method, payload)
    }
  }

  /**
   * Emits an event to all members authorized with the given permission(s).
   * @param requiredPermissions The permission(s) a member must have to receive the event.
   * @param method The method of the event to emit.
   * @param payload The payload of the event to emit.
   */
  public emitToAuthorized<
    TMethod extends TServerMethod,
    TPayload extends Omit<TServerEvents[TMethod], 'method'>,
  >(
    requiredPermissions: TSessionAuthParam,
    method: TMethod,
    payload: TPayload,
  ): void {
    for (let member of this.joinedMembers) {
      if (member.isAuthorized(requiredPermissions)) member.emit(method, payload)
    }
  }

  // todo: When chat channels are reenabled, this method will need to
  // todo: be updated to include appropriate channel data in each payload.
  /**
   * Builds and emits the response events to all members of the session
   * when the session is started or is reset.
   * @param member The member that emitted the initial request.
   * @param event The associated request event.
   * @param responseMethod The method of the event to emit (start or reset).
   */
  protected emitStartResponses(
    event: TClientEvents['request-start-session' | 'request-reset-session'],
    member: ServerSessionMember,
    responseMethod: 'session-started' | 'session-reset',
  ): void {
    let request = member.buildResponseRequestData(event)

    for (let member of this.joinedMembers) {
      let hasCompleteVisibility = member.isAuthorized('completeVisibility')
      let subscribedRealm = member.subscribedRealm
      let assignedForceId = member.assignedForceId
      let realmJsonOptions: TServerRealmJsonOptions

      // Decide serialization options based on the member's visibility
      // and assignments.
      if (!hasCompleteVisibility && assignedForceId) {
        realmJsonOptions = {
          forceExposure: {
            expose: 'force-with-revealed-nodes',
            forceId: assignedForceId,
          },
          fileExposure: { expose: 'accessible', forceId: assignedForceId },
          sessionDataExposure: {
            expose: 'member-specific',
            memberId: member._id,
          },
        }
      } else if (hasCompleteVisibility) {
        realmJsonOptions = {
          forceExposure: { expose: 'all' },
          fileExposure: { expose: 'all' },
          sessionDataExposure: { expose: 'all' },
        }
      } else {
        realmJsonOptions = {
          forceExposure: { expose: 'none' },
          fileExposure: { expose: 'none' },
          sessionDataExposure: { expose: 'all' },
        }
      }
      member.emit(responseMethod, {
        method: responseMethod,
        data: {
          subscribedRealm: subscribedRealm.toJson(realmJsonOptions),
          chatChannels: [],
        },
        request,
      })
    }
  }

  /**
   * Can be added at the beginning of a request handler to ensure
   * that the session is in the required state for the request to
   * be processed.
   * @param member The member that emitted the request event.
   * @param event The request event emitted by the member.
   * @param requiredState The state that the session must be
   * in for the request to be processed.
   * @throws a server emitted error if the session is not in the
   * required state.
   */
  protected requireSessionState = (
    member: ServerSessionMember,
    event: TClientEvents[keyof TRequestEvents],
    requiredState: TSessionState,
  ): void => {
    // Build request for response data.
    let fulfilledRequest = member.buildResponseRequestData(event)

    if (this._state !== requiredState) {
      let error = new ServerEmittedError(
        ServerEmittedError.CODE_SESSION_CONFLICTING_STATE,
        { request: fulfilledRequest },
      )
      member.emitError(error)
      throw error
    }
  }

  /**
   * Sub-handler of `onRequestExecuteAction` which processes the
   * initiation of an action execution.
   * @param member The member provided to `onRequestExecuteAction`.
   * @param event The event provided to `onRequestExecuteAction`.
   * @param execution The execution that was initiated.
   */
  protected onExecution(
    member: ServerSessionMember,
    request: TRequestOfResponse,
    execution: ServerActionExecution,
  ): void {
    let { action } = execution

    // Construct payload for action execution
    // initiated event.
    let initiationPayload: TServerEvents['action-execution-initiated'] = {
      method: 'action-execution-initiated',
      data: {
        execution: execution.toJson(),
        resourcePools: action!.force.toJson({
          sessionDataExposure: { expose: 'all' },
        }).resourcePools,
      },
      request: {
        event: request.event,
        requesterId: member.userId,
        fulfilled: false,
      },
    }

    // Emit action execution initiated event
    // to each member. Scope to the acting action's realm so the
    // initiation only reaches members in that realm.
    for (let recipient of this.getMembersForForce(
      action!.force._id,
      member.subscribedRealmId,
    )) {
      recipient.emit('action-execution-initiated', initiationPayload)
    }

    // Create a new output JSON object.
    let message = /*html*/ `
              <p>Executing <i><action-name></action-name></i> on <i><node-name></node-name></i>.</p>
              <i><action-description></action-description></i>
            `

    // Send the output JSON to the force.
    member.subscribedRealm.sendOutput(
      member.outputPrefix,
      message,
      { type: 'execution-initiation', sourceExecutionId: execution._id },
      { force: action.force },
    )
    // Apply the effects for the action that are triggered
    // immediately.
    this.applyActionEffects(member, action, 'execution-initiation', execution)
  }

  /**
   * Sub-handler of `onRequestExecuteAction` which processes the
   * outcome of an action execution.
   */
  protected onOutcome(
    member: ServerSessionMember,
    request: TRequestOfResponse,
    outcome: ServerExecutionOutcome,
  ): void {
    const { action, node } = outcome

    // Construct payload for action execution
    // completed event.
    let completionPayload: TServerEvents['action-execution-completed'] = {
      method: 'action-execution-completed',
      data: {
        outcome: outcome.toJson(),
      },
      request,
    }

    // If the node has been opened, then process this
    // information in the completion payload.
    if (node.opened) {
      // Extract data from the node.
      const {
        revealedStructure: structure,
        revealedDescendants: descendants,
        revealedDescendantPrototypes: prototypes,
      } = node

      // Update the payload with the gathered data.
      completionPayload.data = {
        ...completionPayload.data,
        _id: node._id,
        forceId: node.forceId,
        structure: structure,
        revealedDescendants: descendants.map((n) =>
          n.toJson({
            sessionDataExposure: {
              expose: 'member-specific',
              memberId: member._id,
            },
          }),
        ),
        revealedDescendantPrototypes: prototypes.map((p) => p.toJson()),
      }
    }

    // Determine effect details based on the status of the outcome.
    let effectTrigger: TEffectTrigger | null = null
    switch (outcome.status) {
      case 'success':
        effectTrigger = 'execution-success'
        break
      case 'failure':
        effectTrigger = 'execution-failure'
        break
    }

    // Emit the action execution completed
    // event to each member for the force.
    for (let forceMember of this.getMembersForForce(
      outcome.forceId,
      member.subscribedRealmId,
    )) {
      forceMember.emit('action-execution-completed', completionPayload)
    }

    // Apply effects, if the outcome calls for it.
    if (effectTrigger)
      this.applyActionEffects(member, action, effectTrigger, outcome.execution)
  }

  /**
   * Callback from target-environment context when the
   * {@link TargetEnvContext.sleep} method is called.
   * A callback is kept here to clean up the sleep calls when
   * the session is requested to end or reset.
   * @param cleanUp The clean up function to call when the session
   * is ending or resetting.
   */
  public onSleep = (cleanUp: () => void): void => {
    this.sleepCleanUps.add(cleanUp)
  }

  /**
   * Records a target-environment task and broadcasts it to members
   * authorized to view target environment results. Called each time the
   * task transitions (announced as `queued`, started as `running`, and
   * resolved); the master list reconciles by ID so an existing entry is
   * updated in place rather than duplicated.
   * @param task The task to record and broadcast.
   */
  public broadcastTask(task: ServerEnvironmentTask): void {
    // Store (or replace) the task for later review.
    this.upsertTask(task)

    // Log failures for server-side diagnosis.
    if (task.status === 'failure') {
      let label =
        task.source.kind === 'effect'
          ? `Effect "${task.source.effectName}" on "${task.source.targetName}"`
          : `Environment hook "${task.environment.name}"`
      targetEnvLogger.error(`${label} failed with error:`, task.error)
    }

    // Forward the task to members authorized to view target environment
    // results.
    this.emitToAuthorized('viewTargetEnvironmentTasks', 'session-task-update', {
      data: {
        task: task.toJson(),
      },
    })
  }

  /**
   * Handler for when a member leaves the session, whether voluntarily
   * or involuntarily. Performs a clean up routine, removing the member
   * from the session if unassigned and removing session-specific
   * listeners from the connection.
   * @param member The member to clean up.
   */
  public onMemberLeave(member: ServerSessionMember): void {
    if (
      !member.banned &&
      !member.isAssignedToForce &&
      !member.isAssignedToRealm &&
      member.userId !== this.ownerId
    ) {
      this._members = this._members.filter(
        (someMember) => member._id !== someMember._id,
      )
    }
    this.removeListeners(member)
  }

  /**
   * Builds a queued {@link ServerEnvironmentTask} for an effect, binding
   * the effect's target script and context to it. The task is announced
   * and run later, as part of a batch, by {@link runEffectTasks}.
   * @param effect The effect to apply.
   * @param context The context for the target script.
   * @param locationMessage A message indicating the location of the
   * effect, used when reporting a stale-context error.
   * @returns The queued effect task, paired with the context needed to
   * run it.
   * @throws If the effect has no target environment or target.
   */
  private buildEffectTask<TType extends TEffectType>(
    effect: ServerEffect<TType>,
    context: TargetScriptContext<TType>,
    locationMessage: string,
  ): TQueuedEffectTask {
    // A target environment and target are required to run the effect.
    if (effect.environment === null) {
      throw new Error(
        `"${effect.name}" doesn't have a target environment or the target environment doesn't exist.`,
      )
    }
    if (effect.target === null) {
      throw new Error(
        `"${effect.name}" doesn't have a target or the target doesn't exist.`,
      )
    }

    // Describe the source of this execution so managers can review
    // and diagnose the effect application.
    let source: TEnvironmentTaskSource = {
      kind: 'effect',
      effectName: effect.name,
      targetName: effect.target.name,
      trigger: effect.trigger,
    }

    // Captured here so the narrowed (non-null) target is bound into the
    // deferred script, which runs later as part of the batch.
    let script = effect.target.script
    let task = ServerEnvironmentTask.create(
      this,
      effect.environment,
      source,
      () => context.run(script),
    )

    return { effect, task, locationMessage }
  }

  /**
   * Runs a predefined batch of effect tasks one by one. The whole batch
   * is first announced as `queued`; each task is then either skipped
   * (unresolved issues, or the session left a permitted state) or run
   * (queued -> running -> resolved).
   * @param entries The queued effect tasks to run.
   * @param isStatePermitted Whether the session is still in a state that
   * permits these effects to run. Re-checked before each task, since the
   * state can change while an earlier task is running.
   */
  private async runEffectTasks(
    entries: TQueuedEffectTask[],
    isStatePermitted: () => boolean,
  ): Promise<void> {
    // Announce the whole batch up front so authorized members see the
    // full list awaiting initiation before any of it runs.
    for (let { task } of entries) task.announce()

    let stopped = false
    for (let { effect, task, locationMessage } of entries) {
      // Once the session leaves a permitted state, skip the remainder.
      if (stopped || !isStatePermitted()) {
        stopped = true
        task.skip()
        continue
      }

      // Effects with unresolved issues are never executed; skip them so
      // authorized members can see they were bypassed.
      if (effect.hasIssues) {
        task.skip()
        continue
      }

      // Apply the effect. The task records and broadcasts itself
      // (queued -> running -> success/failure) as it progresses.
      try {
        let promise = task.run()
        this.effectHistory.push(promise)
        await promise
      } catch (error: any) {
        // The failure is already recorded and logged by the task. Add
        // effect-location context for stale-context errors, which
        // typically stem from delayed async work in a prior instance.
        if (error instanceof OutdatedContextError) {
          let message =
            `Failed to apply effect - "${effect.name}" - to target - "${effect.target?.name}" - found in the environment - "${effect.environment?.name}".\n` +
            `The effect - "${effect.name}" - can be found here:\n` +
            `${locationMessage}\n`
          targetEnvLogger.error(message, error)
        }
      }
    }
  }

  /**
   * Processes the effects of the mission, enacting
   * those of the given trigger.
   * @param trigger The trigger to look for in the effects.
   */
  public async applyMissionEffects(
    trigger: TEffectSessionTriggered,
  ): Promise<void> {
    // Map of triggers to valid session states.
    const triggerToStateMap: Record<TEffectSessionTriggered, TSessionState[]> =
      {
        'session-start': ['started'],
        'session-setup': ['starting', 'resetting'],
        'session-teardown': ['ending', 'resetting'],
      }

    let permittedStates = triggerToStateMap[trigger]

    // Phase 1 — enumerate the effects for this trigger and bind each to a
    // queued task. Each realm runs its own copy of the mission's effects
    // on its own mission, so a single-player session queues effects once
    // per participant realm. In multiplayer there is a single shared
    // realm, so this runs exactly once. Disabled environments are
    // excluded here, so they never enter the queue.
    let entries: TQueuedEffectTask[] = []
    for (let realm of this._realms) {
      let effects = realm.mission.effects
        .filter((effect) => effect.trigger === trigger)
        .filter((effect) => effect.environment)
        .filter(
          (effect) =>
            !this.config.disabledTargetEnvs.includes(effect.environment!._id),
        )
        .sort((a, b) => a.order - b.order)

      for (let effect of effects) {
        let context = TargetScriptContext.createSessionContext(realm, effect)
        entries.push(
          this.buildEffectTask(
            effect,
            context,
            `mission - "${realm.mission.name}" - effect - "${effect.name}".`,
          ),
        )
      }
    }

    // Phase 2 — run the batch one by one, stopping if the session leaves
    // a state that permits this trigger (e.g. it ended mid-run).
    await this.runEffectTasks(entries, () =>
      permittedStates.includes(this.state),
    )
  }

  /**
   * Processes the effects of the given action, enacting
   * those of the given trigger.
   * @param member The member to apply the effects to.
   * @param action The action to process.
   * @param trigger The trigger to look for in the effects.
   * @param execution The action execution that is being processed.
   */
  private async applyActionEffects(
    member: ServerSessionMember,
    action: ServerMissionAction,
    trigger: TEffectExecutionTriggered,
    execution: ServerActionExecution,
  ): Promise<void> {
    // Phase 1 — enumerate the effects for this trigger and bind each to a
    // queued task. Disabled environments are excluded here, so they never
    // enter the queue.
    let entries: TQueuedEffectTask[] = action.effects
      .filter((effect) => effect.trigger === trigger)
      .filter((effect) => effect.environment)
      .filter(
        (effect) =>
          !this.config.disabledTargetEnvs.includes(effect.environment!._id),
      )
      .sort((a, b) => a.order - b.order)
      .map((effect) => {
        let context = TargetScriptContext.createExecutionContext(
          effect,
          member,
          execution,
        )
        return this.buildEffectTask(
          effect,
          context,
          `force - "${effect.sourceForce.name}" - node - "${effect.sourceNode.name}" - action - "${effect.sourceAction.name}" - effect - "${effect.name}".`,
        )
      })

    // Phase 2 — run the batch one by one. These effects should only run
    // while the session is 'started'; if it leaves that state mid-run,
    // the remainder are skipped.
    await this.runEffectTasks(entries, () => this.state === 'started')
  }

  /**
   *  Alerts a session member(s) that a panel has new activity and assists in tracking
   * which panels have pending alerts.
   * @param members The session member(s) to alert.
   * @param panel The panel tab that has new activity.
   */
  public emitSessionPanelAlert(
    members: TInstanceOrArray<ServerSessionMember>,
    panel: TSessionPanelAlert,
  ): void {
    members = ArrayToolbox.toArray(members)

    for (let member of members) {
      let panels = this._pendingSessionPanelAlerts.get(member._id)

      if (!panels) {
        panels = new Set()
        this._pendingSessionPanelAlerts.set(member._id, panels)
      }

      panels.add(panel)
      member.emit('session-panel-alert', { data: { panels: [...panels] } })
    }
  }

  /**
   * Retrieves the set of pending session panel alerts for a member, initializing
   * it if it does not yet exist.
   * @param member The session member whose pending session panel alert set is being retrieved.
   * @returns The set of pending session panel alerts for the member.
   */
  public getSessionPanelAlerts(member: ServerSessionMember) {
    let panels = this._pendingSessionPanelAlerts.get(member._id)
    if (!panels) {
      panels = new Set()
      this._pendingSessionPanelAlerts.set(member._id, panels)
    }
    return panels
  }

  /**
   * Removes a panel from a member's pending session panel alert set.
   * @param member The session member the alert is being cleared for.
   * @param panel The panel tab with an alert to be cleared.
   */
  protected clearSessionPanelAlert(
    member: ServerSessionMember,
    panel: TSessionPanelAlert,
  ): void {
    this._pendingSessionPanelAlerts.get(member._id)?.delete(panel)
  }

  /**
   * Increments the unread chat message count for a member in a given channel,
   * initializing the member's count map if it does not yet exist.
   * @param memberId The ID of the member receiving the message.
   * @param channelId The ID of the channel the message was sent to.
   */
  protected incrementUnreadChatCount(
    memberId: string,
    channelId: string,
  ): void {
    let allChannelsWithUnreadMessages =
      this._unreadChatChannelMessages.get(memberId)

    // If there aren't any channels with unread messages for the member,
    // initialize a new map.
    if (!allChannelsWithUnreadMessages) {
      allChannelsWithUnreadMessages = new Map()

      this._unreadChatChannelMessages.set(
        memberId,
        allChannelsWithUnreadMessages,
      )
    }

    // Otherwise, increment the existing count for the channel.
    let unreadMessages = allChannelsWithUnreadMessages.get(channelId) ?? 0
    allChannelsWithUnreadMessages.set(channelId, unreadMessages + 1)
  }

  /**
   * Clears the unread chat message count for a member in a given channel.
   * @param memberId The ID of the member that the unread messages are being cleared for.
   * @param channelId The ID of the channel that the unread messages are being cleared for.
   */
  protected clearUnreadChatCount(memberId: string, channelId: string): void {
    this._unreadChatChannelMessages.get(memberId)?.delete(channelId)
  }

  /**
   * Returns whether a member has any channels with unread messages.
   * @param memberId The ID of the member to check.
   */
  protected hasPendingUnreadChatMessages(memberId: string): boolean {
    const allChannelsWithUnreadMessages =
      this._unreadChatChannelMessages.get(memberId)

    if (!allChannelsWithUnreadMessages) {
      return false
    }

    const unreadMessagesForEachChannel = Array.from(
      allChannelsWithUnreadMessages.values(),
    )
    return unreadMessagesForEachChannel.some((count) => count > 0)
  }

  /**
   * A registry of all sessions currently launched.
   */
  private static registry: Map<string, SessionServer> = new Map<
    string,
    SessionServer
  >()

  /**
   * Launches a new session with a new session ID.
   * @param mission The mission from which to launch a session.
   * @param config The configuration for the session.
   * @param ownerId The ID of the user that owns the session.
   * @returns A promise of the session server for the newly launched session.
   */
  public static launch(
    mission: ServerMission,
    config: Partial<TSessionConfig> = {},
    owner: ServerUser,
  ): SessionServer {
    return new SessionServer(
      StringToolbox.generateRandomId().substring(0, 8),
      config.name ?? mission.name,
      owner,
      config,
      mission,
    )
  }

  /**
   * @returns the session associated with the given session ID.
   */
  public static get(_id: string | null | undefined): SessionServer | undefined {
    if (!_id) {
      return undefined
    } else {
      return SessionServer.registry.get(_id)
    }
  }

  /**
   * @returns All sessions in the registry.
   */
  public static getAll(): SessionServer[] {
    return Array.from(SessionServer.registry.values())
  }

  /**
   * Destroys the session associated with the given session ID.
   * @param _id The ID of the session to destroy.
   */
  public static destroy(_id: string | undefined): void {
    // Find the session.
    let session: SessionServer | undefined = SessionServer.get(_id)

    // If found...
    if (_id !== undefined && session !== undefined) {
      // Destroy session.
      session.destroy()
    }
  }

  /**
   * Handles a user quitting a METIS session.
   * @param metisSessionId The ID of the METIS session to quit.
   * @param userId The ID of the user quitting the METIS session.
   */
  public static quit(metisSessionId: string, userId: string): void {
    // Find the METIS session.
    const metisSession = SessionServer.get(metisSessionId)
    metisSession?.quit(userId)
  }
}

/* -- TYPES -- */

/**
 * A queued effect task paired with the effect it applies and a message
 * describing that effect's location. Produced by
 * {@link SessionServer.buildEffectTask} and consumed as a batch by
 * {@link SessionServer.runEffectTasks}.
 */
type TQueuedEffectTask = {
  /**
   * The effect being applied.
   */
  effect: ServerEffect
  /**
   * The runnable task that drives the effect's script through its
   * lifecycle (queued -> running -> resolved, or queued -> skipped).
   */
  task: ServerEnvironmentTask
  /**
   * A message describing where the effect lives, used when reporting a
   * stale-context error.
   */
  locationMessage: string
}

/**
 * Options for converting a session to JSON.
 */
export type TSessionServerJsonOptions = {
  /**
   * The user client requesting the JSON.
   * @default undefined
   * @note If defined, then only the data accessible by the user will be included.
   */
  requester?: ServerSessionMember
}

/**
 * Options for {@link SessionServer.toBasicJson} method.
 */
export type TSessionServerBasicJsonOptions = {
  /**
   * The user requesting the JSON, used
   * to determine what data can be exposed.
   * @note If not passed, sensitive data will
   * not be included.
   */
  requester?: ServerUser
}

/**
 * Defines who will receive the output.
 * @default {}
 * @note To broadcast to the entire session, pass nothing.
 * @note To broadcast to a specific force, pass `forceKey`.
 * @note To broadcast to a specific member in the force, pass `memberId`.
 */
export type TOutputTo = {
  /**
   * The force to which the output is sent.
   */
  force: ServerMissionForce
  /**
   * The session member to whom the output is sent.
   */
  member?: ServerSessionMember
}

/**
 * Additional options for {@link SessionServer.getMembersForForce} method.
 */
export type TMembersForForceOptions = {
  /**
   * If true, then only members without complete visibility
   * permissions will be returned.
   * @default false
   */
  limitedVisibilityOnly?: boolean
}
