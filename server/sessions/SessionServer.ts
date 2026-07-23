import type { ClientConnection } from '@server/connect/ClientConnection'
import type { ServerActionExecution } from '@server/missions/actions/ServerActionExecution'
import type { ServerExecutionOutcome } from '@server/missions/actions/ServerExecutionOutcome'
import type { ServerMissionAction } from '@server/missions/actions/ServerMissionAction'
import type { ServerMissionForce } from '@server/missions/forces/ServerMissionForce'
import type { ServerMission } from '@server/missions/ServerMission'
import type {
  TargetEnvContext,
  TTargetEnvExposedSession,
  TTargetEnvExposedSessionConfig,
} from '@server/target-environments/context/TargetEnvContext'
import { ServerEnvironmentTask } from '@server/target-environments/ServerEnvironmentTask'
import type { ServerTargetEnvironment } from '@server/target-environments/ServerTargetEnvironment'
import type { ServerUser } from '@server/users/ServerUser'
import type {
  TClientEvent,
  TClientEvents,
  TRequestEvents,
  TRequestMethod,
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
import type {
  TSessionRealmBasicJson,
  TSessionRealmJson,
} from '@shared/sessions/SessionRealm'
import type {
  TEnvironmentTaskJson,
  TEnvironmentTaskStatus,
} from '@shared/target-environments/TargetEnvironmentTask'
import type { TInstanceOrArray } from '@shared/toolbox/arrays/ArrayToolbox'
import { ArrayToolbox } from '@shared/toolbox/arrays/ArrayToolbox'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import type { User } from '@shared/users/User'
import { sessionLogger, targetEnvLogger } from '../logging'
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
import { onRequestSwitchRealm } from './traffic-controllers/onRequestSwitchRealm'
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
  private effectHistory: Promise<TEnvironmentTaskStatus>[]

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
      ['request-switch-realm', onRequestSwitchRealm],
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
    let realmBasics: TSessionRealmBasicJson[] = []

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
      // all force data and file data, and hand them a shallow
      // listing of every realm so they can switch between them.
      if (requester.isAuthorized('completeVisibility')) {
        realmOptions.forceExposure = { expose: 'all' }
        realmOptions.fileExposure = { expose: 'all' }
        realmBasics = this.realms.map((realm) => realm.toBasicJson())
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
      realmBasics,
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
      limitedObserverIds: this.limitedObservers.map(
        ({ userId: userId }) => userId,
      ),
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
    let allExecutions: Promise<void>[] = []

    this.mission.allNodes.forEach((node) => {
      if (!node.executing) return

      let execution = node.latestExecution!
      // Register the listener (and capture its promise) before aborting, so
      // a synchronous 'aborted' emission can't be missed and the promise is
      // in the array before we await it.
      allExecutions.push(
        new Promise<void>((resolve) => {
          execution.addEventListener('aborted', () => resolve())
        }),
      )
      execution.abort()
    })

    // Wait for every aborted execution to settle. Resolves immediately when
    // there are none.
    await Promise.all(allExecutions)
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

    // Phase 1 — build every setup task: the setup hooks for each realm
    // and environment, then the session-setup effects. Announce them all
    // up front so authorized members see the complete list awaiting
    // initiation before any task begins running.
    let hookBatches: ServerEnvironmentTask[][] = []
    for (let realm of this.realms) {
      for (let environment of environments) {
        if (this.config.disabledTargetEnvs.includes(environment._id)) {
          continue
        }
        hookBatches.push(environment.buildSetUpTasks(realm))
      }
    }
    let effectTasks = this.buildSessionEffectTasks('session-setup')

    for (let batch of hookBatches) {
      for (let task of batch) task.announce()
    }
    for (let task of effectTasks) task.announce()

    // Phase 2 — run the hooks. Each environment's hooks run in sequence
    // (the remaining ones skipped once one fails, since a failed hook may
    // leave the environment unusable), while environments run in parallel.
    await Promise.all(
      hookBatches.map((batch) =>
        ServerEnvironmentTask.runInSequence(batch, { stopOnFailure: true }),
      ),
    )

    // If a setup hook failed, skip the queued effects and do not proceed;
    // the environment may be in an unusable state.
    if (this.setupFailed) {
      for (let task of effectTasks) task.markSkipped()
      return
    }

    // Phase 3 — run the setup effects now that the environments are ready.
    await this.runEffectTasks(effectTasks)
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

    // Get the target environments that the
    // mission of the given session uses.
    let environments = this.mission.targetEnvironments

    // Phase 1 — build every teardown task: the session-teardown effects,
    // then the teardown hooks for each realm and environment. Announce
    // them all up front so authorized members see the complete list
    // awaiting initiation before any task begins running.
    let effectTasks = this.buildSessionEffectTasks('session-teardown')
    let hookBatches: ServerEnvironmentTask[][] = []
    for (let realm of this.realms) {
      for (let environment of environments) {
        if (this.config.disabledTargetEnvs.includes(environment._id)) {
          continue
        }
        hookBatches.push(environment.buildTearDownTasks(realm))
      }
    }

    for (let task of effectTasks) task.announce()
    for (let batch of hookBatches) {
      for (let task of batch) task.announce()
    }

    // Phase 2 — run the teardown effects first, since the hooks sandwich
    // them in the order of operations.
    await this.runEffectTasks(effectTasks)

    // Phase 3 — run the teardown hooks, whether or not the effects
    // succeeded. Unlike setup (where a failed hook aborts the dependent
    // effects), teardown hooks are the cleanup: they release the
    // environment's resources, so they must run regardless to avoid
    // leaking it. Each environment's hooks run in sequence (the remaining
    // ones skipped once one fails, since a failed hook may leave the
    // environment unusable), while environments run in parallel.
    await Promise.all(
      hookBatches.map((batch) =>
        ServerEnvironmentTask.runInSequence(batch, { stopOnFailure: true }),
      ),
    )
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
    // If the session is owner-only, only the owner may join.
    if (this.config.accessibility === 'owner-only' && userId !== this.ownerId) {
      throw ServerEmittedError.CODE_SESSION_UNAUTHORIZED_JOIN
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

    // Notify all members that the member list has changed.
    this.emitMembersUpdated()

    // Return the new member.
    return member
  }

  /**
   * Runs the full start sequence for the session: initializes the mode,
   * dismisses members without any visibility, transitions through
   * `'starting'`, performs full setup, and transitions to `'started'`.
   * @param member The member whose request drives the start.
   * @param event The request event being fulfilled.
   * @param options Additional options to customize how the start is processed.
   * @returns `true` if the session started successfully; `false` if it was
   * rejected (unauthorized/conflicting state — an error is emitted to the
   * member) or setup failed.
   */
  public async start(
    member: ServerSessionMember,
    event: TClientEvents['request-start-session' | 'request-play-test'],
    options: TSessionStartOptions = {},
  ): Promise<boolean> {
    const { fulfillOnStarted = true } = options

    // Build request for response data.
    let fulfilledRequest = member.buildResponseRequestData(event, {
      fulfilled: true,
    })
    let unfulfilledRequest = member.buildResponseRequestData(event, {
      fulfilled: false,
    })

    // If the member does not have the correct permissions
    // to start the session, then emit an error.
    if (!member.isAuthorized('startEndSessions')) {
      member.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
          { request: fulfilledRequest },
        ),
      )
      return false
    }
    // If the session has already previously started,
    // then emit an error.
    if (this._state !== 'unstarted') {
      member.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_CONFLICTING_STATE,
          {
            request: fulfilledRequest,
          },
        ),
      )
      return false
    }

    // A standalone session mints one realm per participant, so
    // starting one with no participants would produce a blank session
    // with nothing to play. Reject the start rather than allow that.
    if (
      this.config.mode === 'standalone' &&
      !this.hasForceAssignableMembers
    ) {
      member.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_NO_PARTICIPANTS,
          { request: fulfilledRequest },
        ),
      )
      return false
    }

    this.initializeMode()

    // Loop through all members and find any
    // that have no force availability, and
    // mark them for dismissal.
    let toDismiss: ServerSessionMember[] = []
    for (let member of this.joinedMembers) {
      if (
        (!member.isAssignedToForce || !member.isAssignedToRealm) &&
        !member.isAuthorized('completeVisibility')
      ) {
        toDismiss.push(member)
      }
    }

    // Dismiss members found.
    for (let member of toDismiss) {
      // Emit an event to the member that they have
      // been dismissed.
      member.emit('dismissed', { data: {} })
      member.leave()
    }

    // Notify all members that the member list has changed.
    this.emitMembersUpdated()

    // Emit starting event. Then, once set up is complete,
    // emit started event.
    this._state = 'starting'
    this.emitToAll('session-starting', {
      data: {},
      request: unfulfilledRequest,
    })

    // Perform setup.
    await this.setUp()

    // If the setup failed...
    if (this.setupFailed) {
      // ...and it is a test session, then destroy it.
      if (this.config.isTest) {
        this._state = 'ended'
        this.destroy()
      }
      // ...do not proceed.
      return false
    }

    // Mark the session as started.
    this._state = 'started'
    this.emitStartResponses(event, member, 'session-started', {
      fulfilled: fulfillOnStarted,
    })
    // Perform any effect triggered by session start.
    this.applyMissionEffects('session-start')

    return true
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
    if (this.config.isTest) {
      this._state = 'ending'
      this.tearDown().then(() => {
        // If there were teardown errors, do not proceed.
        if (this.teardownFailed) return
        this._state = 'ended'
        this.destroy()
      })
    }

    member.leave()

    // Notify all members that the member list has changed.
    this.emitMembersUpdated()
  }

  /**
   * Spawns one realm per participant/participant-observer for a
   * standalone session, each containing only the configured
   * force, and assigns each member to their realm.
   */
  private spawnStandaloneRealms(): void {
    let standaloneForceId = this.config.standaloneForceId
    if (!standaloneForceId) {
      throw new Error(
        'Cannot mint standalone realms without a configured force.',
      )
    }

    this._realms = []

    // Only force-assignable members are assigned to realms in
    // standalone mode.
    for (let member of this.forceAssignableMembers) {
      let realm = ServerSessionRealm.createNew(member.username, this, {
        missionMintOptions: {
          forceExposure: {
            expose: 'force-with-all-nodes',
            forceId: standaloneForceId,
          },
          fileExposure: { expose: 'all' },
          rootEffectsExposure: { expose: 'all' },
        },
      })

      member.assignToForce(standaloneForceId)
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

    // Force-assignable members are assigned to and share
    // the single realm in multiplayer mode.
    for (let member of this.forceAssignableMembers) {
      member.assignToRealm(realm)
      member.subscribeToRealm(realm)
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
    // standalone this is one realm per participant (which also
    // assigns every participant a force/realm, so the dismissal check
    // below treats them as assigned); in multiplayer it is the single
    // shared realm.
    if (this.config.mode === 'standalone') {
      this.enforceStandaloneRoles()
      this.spawnStandaloneRealms()
      this.enforceStandaloneTargetEnvs()
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
   * In standalone mode, locks every target environment used by the
   * mission that does not support multiple realms into the disabled
   * list. This prevents unsupported environments from colliding
   * across the per-participant realms running simultaneously.
   * @note A no-op outside standalone mode.
   */
  private enforceStandaloneTargetEnvs(): void {
    if (this.config.mode !== 'standalone') return

    let disabled = new Set(this._config.disabledTargetEnvs)
    for (let environment of this.mission.targetEnvironments) {
      if (!environment.multiRealmSupport) {
        disabled.add(environment._id)
      }
    }
    this._config.disabledTargetEnvs = [...disabled]
  }

  /**
   * In standalone mode, converts every limited observer into a
   * participant. A limited observer is routed to a dedicated,
   * do-nothing realm, which is meaningless in standalone where every
   * participant already has their own isolated realm; rather than mint
   * that dead realm, the member is switched to a playable participant.
   * @returns The members whose role was changed, so callers can decide
   * whether to notify clients of the updated roster.
   * @note A no-op outside standalone mode.
   */
  protected enforceStandaloneRoles(): ServerSessionMember[] {
    if (this.config.mode !== 'standalone') return []

    let changed = this.limitedObservers
    for (let member of changed) {
      member.assignToRole('participant')
    }
    return changed
  }

  /**
   * Creates session-specific listeners for the given member.
   */
  private addListeners(member: ServerSessionMember): void {
    this.listenerInputRegistry.forEach(([method, handler]) => {
      member.connection?.addEventListener(method, (event: any) => {
        // Controllers may run synchronously or asynchronously. Route a
        // synchronous throw and an async rejection through the same
        // backstop so one member's request can never escalate into an
        // unhandled rejection — which, under Node's default policy, would
        // surface as an uncaught exception and take down the whole process.
        try {
          let result = handler(member, event) as unknown
          if (result instanceof Promise) {
            result.catch((error) =>
              this.handleControllerError(member, event, error),
            )
          }
        } catch (error) {
          this.handleControllerError(member, event, error)
        }
      })
    })
  }

  /**
   * Backstop for errors escaping a session traffic controller. Expected
   * failures throw a {@link ServerEmittedError}, which the controller has
   * already surfaced to the requesting member — those are ignored here.
   * Anything else is an unexpected error (a bug, a null deref, etc.): it is
   * logged for diagnosis and reported to the requesting member as a generic
   * server error, keeping the failure scoped to the offending request
   * instead of crashing the process.
   * @param member The member whose request was being handled.
   * @param event The client event being handled when the error occurred.
   * @param error The error thrown (or rejected) by the controller.
   */
  private handleControllerError(
    member: ServerSessionMember,
    event: TClientEvent,
    error: unknown,
  ): void {
    // A ServerEmittedError is an expected failure the controller has
    // already emitted to the member; nothing more to do.
    if (error instanceof ServerEmittedError) return

    sessionLogger.error(
      `Unexpected error in session traffic controller for "${event.method}" ` +
        `(session ${this._id}, member ${member.userId}):`,
      error,
    )

    // Correlate the error with the originating request when possible; the
    // two non-request listeners (panel-alert ack/fetch) carry no requestId.
    let request =
      'requestId' in event
        ? member.buildResponseRequestData(
            event as TClientEvents[TRequestMethod],
          )
        : undefined

    member.emitError(
      new ServerEmittedError(ServerEmittedError.CODE_SERVER_ERROR, { request }),
    )
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
   * Notifies all members that the session's member list has changed, sending
   * the current serialized members so clients can refresh their lists (and any
   * derived state, such as per-realm member counts).
   */
  public emitMembersUpdated(): void {
    this.emitToAll('session-members-updated', {
      data: {
        members: this.members.map((member) => member.toJson()),
      },
    })
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
   * @param options Additional options controlling the responses.
   */
  protected emitStartResponses(
    event: TClientEvents[
      | 'request-start-session'
      | 'request-reset-session'
      | 'request-play-test'],
    member: ServerSessionMember,
    responseMethod: 'session-started' | 'session-reset',
    options: TEmitStartResponsesOptions = {},
  ): void {
    const { fulfilled = true } = options
    let request = member.buildResponseRequestData(event, {
      fulfilled,
    })

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

      let subscribedRealmJson = subscribedRealm.toJson(realmJsonOptions)
      let realmBasicsJson = hasCompleteVisibility
        ? this.realms.map((realm) => realm.toBasicJson())
        : []

      member.emit(responseMethod, {
        method: responseMethod,
        data: {
          subscribedRealm: subscribedRealmJson,
          chatChannels: [],
          realmBasics: realmBasicsJson,
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
   * Runs a predefined batch of already-announced effect tasks one by one.
   * Each task settles itself as it runs (queued -> running -> resolved),
   * skipping when its effect has unresolved issues or the session has left
   * a state that permits its trigger.
   * @param tasks The announced effect tasks to run.
   */
  private async runEffectTasks(tasks: ServerEnvironmentTask[]): Promise<void> {
    for (let task of tasks) {
      let promise = task.run()
      this.effectHistory.push(promise)
      await promise
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
    // Phase 1 — build and announce the batch so authorized members see
    // the full list awaiting initiation before any of it runs.
    let tasks = this.buildSessionEffectTasks(trigger)
    for (let task of tasks) task.announce()

    // Phase 2 — run the batch one by one. Each task skips itself if the
    // session has left a state that permits this trigger (e.g. it ended
    // mid-run).
    await this.runEffectTasks(tasks)
  }

  /**
   * Builds the queued effect tasks for the given session trigger across
   * every realm, without announcing or running them. Each realm runs its
   * own copy of the mission's effects on its own mission, so a
   * standalone session builds effects once per participant realm; in
   * multiplayer there is a single shared realm, so this builds exactly
   * one set. Disabled environments are excluded here, so they never enter
   * the queue.
   * @param trigger The trigger whose effects to build tasks for.
   * @returns The queued effect tasks.
   */
  private buildSessionEffectTasks(
    trigger: TEffectSessionTriggered,
  ): ServerEnvironmentTask[] {
    let entries: ServerEnvironmentTask[] = []
    for (let realm of this._realms) {
      let effects = realm.mission.selectEffects({
        triggers: [trigger],
        environmentPresence: 'with-environment',
        excludeEnvironments: this.config.disabledTargetEnvs,
      })

      for (let effect of effects) {
        entries.push(
          ServerEnvironmentTask.forEffect({
            effectType: 'sessionTriggeredEffect',
            realm,
            effect,
          }),
        )
      }
    }
    return entries
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
    let effects = action.selectEffects({
      triggers: [trigger],
      environmentPresence: 'with-environment',
      excludeEnvironments: this.config.disabledTargetEnvs,
      sort: true,
    })
    let tasks = effects.map((effect) =>
      ServerEnvironmentTask.forEffect({
        effectType: 'executionTriggeredEffect',
        effect,
        member,
        execution,
      }),
    )
    for (let task of tasks) task.announce()

    // Phase 2 — run the batch one by one. These effects should only run
    // while the session is 'started'; if it leaves that state mid-run,
    // the remainder are skipped.
    await this.runEffectTasks(tasks)
  }

  /**
   *  Alerts a session member(s) that a panel has new activity and assists in tracking
   * which panels have pending alerts.
   * @param members The session member(s) to alert.
   * @param panel The panel tab that has new activity.
   * @note THIS HAS BEEN DISABLED UNTIL 2.6. Also see
   * {@link ServerSessionRealm.updateFileAccess} for more disabled panel-alert code.
   */
  public emitSessionPanelAlert(
    members: TInstanceOrArray<ServerSessionMember>,
    panel: TSessionPanelAlert,
  ): void {
    //     members = ArrayToolbox.toArray(members)
    //
    //     for (let member of members) {
    //       let panels = this._pendingSessionPanelAlerts.get(member._id)
    //
    //       if (!panels) {
    //         panels = new Set()
    //         this._pendingSessionPanelAlerts.set(member._id, panels)
    //       }
    //
    //       panels.add(panel)
    //       member.emit('session-panel-alert', { data: { panels: [...panels] } })
    //     }
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

/**
 * Additional options for the {@link SessionServer.start} method.
 */
export type TSessionStartOptions = {
  /**
   * Whether the emitted `session-started` response marks the request as
   * fulfilled. Defaults to `true` for a normal start (where `session-started`
   * is the terminal response). The play-test flow passes `false` so its
   * request stays open for a following `play-test-started` terminal response.
   * @default true
   */
  fulfillOnStarted?: boolean
}

/**
 * Additional options for the {@link SessionServer.emitStartResponses} method.
 */
export type TEmitStartResponsesOptions = {
  /**
   * Whether the emitted responses mark the request as fulfilled.
   * @default true
   */
  fulfilled?: boolean
}
