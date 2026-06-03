import type { ClientConnection } from '@server/connect/ClientConnection'
import type { ServerActionExecution } from '@server/missions/actions/ServerActionExecution'
import type { ServerExecutionOutcome } from '@server/missions/actions/ServerExecutionOutcome'
import { ServerMissionAction } from '@server/missions/actions/ServerMissionAction'
import type { ServerEffect } from '@server/missions/effects/ServerEffect'
import type { ServerMissionFile } from '@server/missions/files/ServerMissionFile'
import type { ServerMissionForce } from '@server/missions/forces/ServerMissionForce'
import { ServerOutput } from '@server/missions/forces/ServerOutput'
import type { ServerResourcePool } from '@server/missions/forces/ServerResourcePool'
import type { ServerMissionNode } from '@server/missions/nodes/ServerMissionNode'
import { ServerMission } from '@server/missions/ServerMission'
import { OutdatedContextError } from '@server/target-environments/context/OutdatedContextError'
import type {
  TargetEnvContext,
  TTargetEnvExposedSession,
  TTargetEnvExposedSessionConfig,
} from '@server/target-environments/context/TargetEnvContext'
import { TargetScriptContext } from '@server/target-environments/context/TargetScriptContext'
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
import type { TActionModifier } from '@shared/missions/actions/MissionAction'
import type {
  TEffectExecutionTriggered,
  TEffectSessionTriggered,
  TEffectTrigger,
  TEffectType,
} from '@shared/missions/effects/Effect'
import type { TOutputContext } from '@shared/missions/forces/MissionOutput'
import type {
  TMissionJson,
  TMissionJsonOptions,
} from '@shared/missions/Mission'
import type { MissionComponent } from '@shared/missions/MissionComponent'
import { type TNodeAlertSeverityLevel } from '@shared/missions/nodes/NodeAlert'
import type { TChatChannelJson } from '@shared/sessions/chat/ChatChannel'
import type { TSessionAuthParam } from '@shared/sessions/members/MemberPermission'
import type { TMemberRoleId } from '@shared/sessions/members/MemberRole'
import { MemberRole } from '@shared/sessions/members/MemberRole'
import type { TSessionMemberJson } from '@shared/sessions/members/SessionMember'
import type {
  TSessionBasicJson,
  TSessionConfig,
  TSessionJson,
  TSessionState,
} from '@shared/sessions/MissionSession'
import { MissionSession } from '@shared/sessions/MissionSession'
import type { TEnvScriptResultJson } from '@shared/target-environments/EnvScriptResults'
import { EnvScriptResults } from '@shared/target-environments/EnvScriptResults'
import type { TInstanceOrArray } from '@shared/toolbox/arrays/ArrayToolbox'
import { ArrayToolbox } from '@shared/toolbox/arrays/ArrayToolbox'
import { type TSingleTypeObject } from '@shared/toolbox/objects/ObjectToolbox'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import type { User } from '@shared/users/User'
import { targetEnvLogger } from '../logging'
import { ServerChatChannel } from './chat/ServerChatChannel'
import { ServerChatMessage } from './chat/ServerChatMessage'
import { ComponentModifierBatchMap } from './ComponentModifierBatchMap'
import { ServerSessionMember } from './ServerSessionMember'
import { TargetEnvStore } from './TargetEnvStore'

/**
 * Server instance for sessions. Handles server-side logic for a session with participating clients. Communicates with clients to conduct the session.
 */
export class SessionServer extends MissionSession<TMetisServerComponents> {
  /**
   * @see {@link instanceId}.
   */
  private _instanceId: string

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
   * Assignments of users to forces (userID to forceID).
   * @note Assignments are also stored in the `SessionMember` class,
   * but this will help with rejoining, since a new `SessionMember`
   * object is created each time a user joins.
   */
  private assignments: TSingleTypeObject<{
    forceId: string
    roleId: TMemberRoleId
  }>

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
  private _pendingSessionPanelAlerts = new Map<
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
      ['request-start-session', this.onRequestStart],
      ['request-end-session', this.onRequestEnd],
      ['request-reset-session', this.onRequestReset],
      ['request-config-update', this.onRequestConfigUpdate],
      ['request-kick', this.onRequestKick],
      ['request-ban', this.onRequestBan],
      ['request-assign-force', this.onRequestAssignForce],
      ['request-assign-role', this.onRequestAssignRole],
      ['request-open-node', this.onRequestOpenNode],
      ['request-execute-action', this.onRequestExecuteAction],
      ['request-send-output', this.onRequestSendOutput],
      ['request-acknowledge-node-alert', this.onRequestAcknowledgeNodeAlert],
      ['request-send-chat-message', this.onRequestSendChatMessage],
      ['acknowledge-session-panel-alert', this.onAcknowledgeSessionPanelAlert],
      ['fetch-session-panel-alerts', this.onFetchSessionPanelAlerts],
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
      [],
    )
    this._instanceId = StringToolbox.generateRandomId()
    this._state = 'unstarted'
    this._destroyed = false
    this.initializeMission()
    this.register()
    this.assignments = {}
    this.sleepCleanUps = new Set<() => void>()
    this.effectHistory = []
  }

  // Implemented
  protected parseMemberData(data: TSessionMemberJson[]): ServerSessionMember[] {
    // Returns empty array, since the data
    // should never need to be parsed.
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
   * Gets the users that have access to the force with the given ID.
   * @param forceId The ID of the force.
   * @param options Additional options to tailor the members returned based on
   * the callers needs.
   * @returns The users.
   */
  public getMembersForForce(
    forceId: string,
    options: TMembersForForceOptions = {},
  ): ServerSessionMember[] {
    const { limitedVisibilityOnly = false } = options

    // Get all members that either have complete visibility
    // or are assigned to the force with the given ID.
    return this.members.filter((member) => {
      let hasCompleteVisibility = member.isAuthorized('completeVisibility')
      let isAssignedToForce = member.forceId === forceId

      if (limitedVisibilityOnly) {
        return !hasCompleteVisibility && isAssignedToForce
      } else {
        return hasCompleteVisibility || isAssignedToForce
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
  private getVisibleChannels(member: ServerSessionMember): ServerChatChannel[] {
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
    let missionOptions: TMissionJsonOptions = {
      forceExposure: { expose: 'none' },
      fileExposure: { expose: 'none' },
      sessionDataExposure: { expose: 'all' },
      rootEffectsExposure: { expose: 'none' },
    }
    let banList: string[] = []
    let setupResults: TEnvScriptResultJson[] = []
    let teardownResults: TEnvScriptResultJson[] = []
    let chatChannels: TChatChannelJson[] = []
    let pendingSessionPanelAlerts: TSessionPanelAlert[] = []
    let unreadChatChannelMessages: Record<string, number> = {}

    // Handler a requester being passed.
    if (requester) {
      // Gather details.
      let { forceId } = requester

      // Update the session-data exposure to be user
      // specific to the requester.
      missionOptions.sessionDataExposure = {
        expose: 'member-specific',
        memberId: requester._id,
      }

      // If the requester is assigned to a force,
      // then update the mission options to include
      // data pertinent to the force.
      if (forceId) {
        missionOptions.forceExposure = {
          expose: 'force-with-revealed-nodes',
          forceId,
        }
        missionOptions.fileExposure = {
          expose: 'accessible',
          forceId,
        }
      }

      // If the requester has complete visibility,
      // then update the mission options to expose
      // all force data and file data.
      if (requester.isAuthorized('completeVisibility')) {
        missionOptions.forceExposure = { expose: 'all' }
        missionOptions.fileExposure = { expose: 'all' }
      }

      // If the requester is authorized to manager
      // users, then include the ban list.
      if (requester.isAuthorized('manageSessionMembers')) banList = this.banList

      // If the requester is authorized to start/end sessions,
      // then include the setup and teardown results.
      if (requester.isAuthorized('startEndSessions')) {
        setupResults = this.setupResults.map((result) => result.toJson())
        teardownResults = this.teardownResults.map((result) => result.toJson())
      }

      // Grab the chat channels visible to the requester.
      chatChannels = this.getVisibleChannels(requester).map((c) => c.toJson())

      // Grab all pending session panel alerts for the requester.
      pendingSessionPanelAlerts = [
        ...(this._pendingSessionPanelAlerts.get(requester._id) ?? []),
      ]

      // Grab all unread chat channel messages for the requester.
      unreadChatChannelMessages = Object.fromEntries(
        this._unreadChatChannelMessages.get(requester._id) ?? new Map(),
      )
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
      mission: this.mission.toExistingJson(missionOptions),
      members: this._members.map((member) => member.toJson()),
      banList,
      config: this.config,
      setupResults,
      teardownResults,
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
    let banList: string[] = []
    let setupFailed: boolean = false
    let teardownFailed: boolean = false

    // If the requester is authorized to write
    // to sessions, include the ban list.
    if (requester?.isAuthorized('sessions_write_native')) {
      banList = this.banList
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
      banList,
      observerIds: this.observers.map(({ userId: userId }) => userId),
      managerIds: this.managers.map(({ userId: userId }) => userId),
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

  // Implemented
  protected mapActions(): void {
    // Initialize the actions map.
    this.actions = new Map<string, ServerMissionAction>()

    // Loops through and maps each action.
    this.mission.forces.forEach((force) =>
      force.nodes.forEach((node) =>
        node.actions.forEach((action) => this.actions.set(action._id, action)),
      ),
    )
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
    // Unregister session.
    this.unregister()
    // Mark as destroyed.
    this._destroyed = true
    // Clean up all cached target environment stores for this session.
    TargetEnvStore.cleanUp(this._id)
    // Grab all members.
    let members: ServerSessionMember[] = this.members
    // Clear all members.
    this.clearMembers()
    // Clear assignments.
    this.assignments = {}
    // Emit an event to all users that the session has been destroyed.
    for (let { connection } of members) {
      connection.emit('session-destroyed', { data: { sessionId: this._id } })
    }
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
    // ! the effects in terms of order of operations.

    // Get the target environments that the
    // mission of the given session uses.
    let environments = this.mission.targetEnvironments
    let setUpPromises: Promise<EnvScriptResults[]>[] = []

    // For each target environment in the registry, set it up.
    for (let environment of environments) {
      // Run the target-environment setup hooks.
      let promise = environment.setUp(this)
      // Handle resolution per environment.
      promise.then((results) => {
        this.onSetupScriptResolution(...results)
      })
      // Store the promise, for awaiting later.
      setUpPromises.push(promise)
    }

    // Await all environment setups.
    await Promise.all(setUpPromises)

    // If there were setup errors, do not proceed.
    if (this.setupFailed) return

    let results = await this.applyMissionEffects('session-setup')
    this.onSetupScriptResolution(...results)
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
    // ! the effects in terms of order of operations.

    // Apply mission effects purposed for session teardown.
    let results = await this.applyMissionEffects('session-teardown')
    this.onTeardownScriptResolution(...results)

    // If there were teardown errors, do not proceed.
    if (this.teardownFailed) return

    // Get the target environments that the
    // mission of the given session uses.
    let environments = this.mission.targetEnvironments
    let tearDownPromises: Promise<EnvScriptResults[]>[] = []

    // For each target environment in the registry, tear it down.
    for (let environment of environments) {
      // Run the target-environment teardown hooks.
      let promise = environment.tearDown(this)
      // Handle resolution per environment.
      promise.then((results) => {
        this.onTeardownScriptResolution(...results)
      })
      // Store the promise, for awaiting later.
      tearDownPromises.push(promise)
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
    // Remove all members from the session by
    // forcing each member to quit.
    this.members.forEach(({ connection }) =>
      connection.login.onMetisSessionQuit(),
    )
    this.members.forEach((member) => this.removeListeners(member))
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
    let assignment = this.assignments[userId] ?? {}
    let roleId: TMemberRoleId | null
    let forceId: string | null = assignment.forceId ?? null
    let isUnstarted = this._state === 'unstarted'

    // Throw error if the user is in the ban list.
    if (this._banList.includes(client.userId)) {
      throw ServerEmittedError.CODE_SESSION_BANNED
    }
    // Throw error if the user is already in the session.
    if (this.isJoined(client.userId)) {
      throw ServerEmittedError.CODE_ALREADY_IN_SESSION
    }

    // If the user already has an assigned role, then
    // join with that role.
    if (assignment.roleId) {
      roleId = assignment.roleId
    }
    // If the user is authorized to join as a manager,
    // then join as a manager.
    else if (client.user.isAuthorized('sessions_join_manager')) {
      roleId = MemberRole.AVAILABLE_ROLES.manager._id
    }
    // If the user is authorized to join as a manager
    // of native forces, and the client is the owner of
    // this session, then join as a manager.
    else if (
      client.user.isAuthorized('sessions_join_manager_native') &&
      this.ownerId === userId
    ) {
      roleId = MemberRole.AVAILABLE_ROLES.manager._id
    }
    // If the user is authorized to join as an observer,
    // then join as an observer.
    else if (client.user.isAuthorized('sessions_join_observer')) {
      roleId = MemberRole.AVAILABLE_ROLES.observer._id
    }
    // If the user is authorized to join as a participant,
    // then join as a participant.
    else if (client.user.isAuthorized('sessions_join_participant')) {
      roleId = MemberRole.AVAILABLE_ROLES.participant._id
    }
    // If the user is not authorized to join the session,
    // then throw an error.
    else {
      throw ServerEmittedError.CODE_SESSION_UNAUTHORIZED_JOIN
    }

    // Gather more details.
    let role = MemberRole.get(roleId)
    let hasCompleteVisibility = role.isAuthorized('completeVisibility')
    let isAssigned = forceId !== null

    // If the session is already starting/started, ensure that
    // the member has visibility to at least one force.
    if (!isUnstarted && !hasCompleteVisibility && !isAssigned) {
      throw ServerEmittedError.CODE_SESSION_LATE_JOIN
    }

    // Create a new session member.
    let member = ServerSessionMember.create(client, role, this, forceId)
    // Add event listeners for the member.
    this.addListeners(member)
    // Push the member to the list of members.
    this._members.push(member)

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
      member.connection = newConnection
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
   * Gets the file from the mission with the given ID.
   * @param missionFileId The ID of the file to get.
   * @returns The file, or undefined if not found.
   */
  public getFile(missionFileId: string): ServerMissionFile | undefined {
    return this.mission.files.find(({ _id }) => missionFileId === _id)
  }

  /**
   * Has the given user (participant or observer) quit the session.
   * @param userId The ID of the user quiting the session.
   * @note Removes any session listeners for the user.
   */
  public quit(userId: string): void {
    // Find the member that quit, if present.
    this._members.forEach((member: ServerSessionMember, index: number) => {
      if (member.userId === userId) {
        // Remove the member from the list.
        this._members.splice(index, 1)
        // Remove session-specific listeners.
        this.removeListeners(member)
        // If the session is for testing, then tear it
        // down and destroy it.
        if (this.config.accessibility === 'testing') {
          this._state = 'ending'
          this.tearDown().then(() => {
            // If there were teardown errors, do not proceed.
            if (this.teardownFailed) return
            this._state = 'ended'
            this.destroy()
          })
        }
        // Handle quitting the session for the member.
        member.connection.login.onMetisSessionQuit()
      }
    })

    // Emit an event to all users that the user list
    // has changed.
    this.emitToAll('session-members-updated', {
      data: {
        members: this.members.map((member) => member.toJson()),
      },
    })
  }

  /**
   * Initializes the mission for the session.
   */
  private initializeMission(): void {
    this.mission.forces.forEach((force) => {
      // Generate the intro message output for every force.
      force.sendIntroMessage()
      force.handleExcludedNodes()
    })
  }

  /**
   * Creates session-specific listeners for the given member.
   */
  private addListeners(member: ServerSessionMember): void {
    this.listenerInputRegistry.forEach(([method, handler]) => {
      member.connection.addEventListener(method, (event: any) =>
        handler(member, event),
      )
    })
  }

  /**
   * Removes session-specific listeners for the given participant.
   */
  private removeListeners(member: ServerSessionMember): void {
    member.connection.clearEventListeners(
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
    for (let member of this._members) member.emit(method, payload)
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
    for (let member of this._members) {
      if (member.role._id === roleId) member.emit(method, payload)
    }
  }

  /**
   * Builds and emits the response events to all members of the session
   * when the session is started or is reset.
   * @param member The member that emitted the initial request.
   * @param event The associated request event.
   * @param responseMethod The method of the event to emit (start or reset).
   */
  private emitStartResponses(
    event: TClientEvents['request-start-session' | 'request-reset-session'],
    member: ServerSessionMember,
    responseMethod: 'session-started' | 'session-reset',
  ): void {
    // Build request for response data.
    let request = member.connection.buildResponseReqData(event)
    // Cache used to not export the same force twice
    // for two members assigned to the same force.
    const assignmentForceCache: TSingleTypeObject<TMissionJson> = {}
    // Cache complete visibility export.
    let completeVisibilityCache = this.mission.toJson({
      forceExposure: { expose: 'all' },
      fileExposure: { expose: 'all' },
      sessionDataExposure: { expose: 'all' },
    })

    // (Re-)derive chat channels from the mission's forces and reset messages.
    this._chatChannels = [
      ServerChatChannel.createAll(this),
      ...this.mission.forces.map((force) =>
        ServerChatChannel.fromForce(force, this),
      ),
    ]
    // Serialize all channels for members with complete visibility.
    let allChatChannelsJson = this._chatChannels.map((c) => c.toJson())

    // Loop through members, and emit a start event to
    // all of them, including mission data specific to
    // their permissions.
    for (let member of this.members) {
      let hasCompleteVisibility = member.isAuthorized('completeVisibility')
      let isAssigned = member.isAssigned

      // If the member does not have complete visibility
      // and is assigned to a force, then export force-specific
      // data.
      if (!hasCompleteVisibility && isAssigned) {
        // Get the force ID for the member.
        let forceId = member.forceId!

        // If the force has not been cached, then cache it.
        if (!assignmentForceCache[forceId]) {
          assignmentForceCache[forceId] = this.mission.toJson({
            forceExposure: { expose: 'force-with-revealed-nodes', forceId },
            fileExposure: { expose: 'accessible', forceId },
            sessionDataExposure: {
              expose: 'all',
            },
          })
        }

        // Get relevant data from the mission for the member.
        let { structure, forces, prototypes, files } =
          assignmentForceCache[forceId]

        // Filter the outputs not relevant to the member.
        forces.forEach(({ filterOutputs }) => {
          if (filterOutputs) filterOutputs(member._id)
        })

        // Emit the event to the member.
        member.emit(responseMethod, {
          method: responseMethod,
          data: {
            structure,
            forces,
            prototypes,
            files,
            chatChannels: this.getVisibleChannels(member).map((c) =>
              c.toJson(),
            ),
          },
          request,
        })
      }
      // Else if the member has complete visibility, then
      // provide all data.
      else if (hasCompleteVisibility) {
        // Filter the outputs not relevant to the member.
        completeVisibilityCache.forces.forEach(({ filterOutputs }) => {
          if (filterOutputs) filterOutputs(member._id)
        })

        // Emit the event to the member.
        member.emit(responseMethod, {
          method: responseMethod,
          data: {
            structure: completeVisibilityCache.structure,
            forces: completeVisibilityCache.forces,
            prototypes: completeVisibilityCache.prototypes,
            files: completeVisibilityCache.files,
            chatChannels: allChatChannelsJson,
          },
          request,
        })
      }
      // Else, export nothing.
      else {
        // Emit the event to the member.
        member.emit(responseMethod, {
          method: responseMethod,
          data: {
            structure: {},
            forces: [],
            prototypes: [],
            files: [],
            chatChannels: [],
          },
          request,
        })
      }
    }
  }

  private buildFullfilledRequest<TMethod extends keyof TRequestEvents>(
    member: ServerSessionMember,
    event: TClientEvents[TMethod],
  ): TRequestOfResponse {
    return member.connection.buildResponseReqData(event, {
      fulfilled: true,
    })
  }

  private requireSessionState = (
    member: ServerSessionMember,
    event: TClientEvents[keyof TRequestEvents],
    requiredState: TSessionState,
  ): void => {
    // Build request for response data.
    let fulfilledRequest = this.buildFullfilledRequest(member, event)

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
   * Called when a member requests to start the session.
   * @param member The member requesting to start the session.
   * @param event The event emitted by the member.
   */
  public onRequestStart = async (
    member: ServerSessionMember,
    event: TClientEvents['request-start-session'],
  ): Promise<void> => {
    // Build request for response data.
    let fulfilledRequest = member.connection.buildResponseReqData(event, {
      fulfilled: true,
    })
    let unfulfilledRequest = member.connection.buildResponseReqData(event, {
      fulfilled: false,
    })

    // If the member does not have the correct permissions
    // to start the session, then emit an error.
    if (!member.isAuthorized('startEndSessions')) {
      return member.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
          { request: fulfilledRequest },
        ),
      )
    }
    // If the session has already previously started,
    // then emit an error.
    if (this._state !== 'unstarted') {
      return member.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_CONFLICTING_STATE,
          { request: fulfilledRequest },
        ),
      )
    }

    // Loop through all members and find any
    // that have no force availability, and
    // mark them for dismissal.
    let toDismiss: ServerSessionMember[] = []
    for (let member of this.members) {
      if (!member.isAssigned && !member.isAuthorized('completeVisibility')) {
        toDismiss.push(member)
      }
    }

    // Dismiss members found.
    for (let member of toDismiss) {
      // Remove the member from the list.
      this._members = this._members.filter(({ _id }) => _id !== member._id)
      // Remove session-specific listeners.
      this.removeListeners(member)
      // Handle quitting the session for the member.
      member.connection.login.onMetisSessionQuit()
      // Emit an event to the member that they have
      // been dismissed.
      member.emit('dismissed', { data: {} })
    }

    // Emit an event to all users that the user list
    // has changed.
    this.emitToAll('session-members-updated', {
      data: {
        members: this.members.map((member) => member.toJson()),
      },
    })

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
      if (this.config.accessibility === 'testing') {
        this._state = 'ended'
        this.destroy()
      }
      // ...do not proceed.
      return
    }

    // Mark the session as started.
    this._state = 'started'
    this.emitStartResponses(event, member, 'session-started')
    // Perform any effect triggered by session start.
    this.applyMissionEffects('session-start')
  }

  /**
   * Called when a member requests to end the session.
   * @param member The member requesting to end the session.
   * @param event The event emitted by the member.
   */
  public onRequestEnd = async (
    member: ServerSessionMember,
    event: TClientEvents['request-end-session'],
  ): Promise<void> => {
    // Build request for response data.
    let fulfilledRequest = member.connection.buildResponseReqData(event, {
      fulfilled: true,
    })
    let unfulfilledRequest = member.connection.buildResponseReqData(event, {
      fulfilled: false,
    })

    // If the member does not have the correct permissions
    // to start the session, then emit an error.
    if (!member.isAuthorized('startEndSessions')) {
      return member.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
          { request: fulfilledRequest },
        ),
      )
    }
    // If the session is not in the 'started' state,
    // then emit an error.
    if (this._state !== 'started') {
      return member.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_CONFLICTING_STATE,
          { request: fulfilledRequest },
        ),
      )
    }

    // Emit ending event. Then, once tear down is complete,
    // emit ended event.
    this._state = 'ending'
    this.emitToAll('session-ending', {
      data: {},
      request: unfulfilledRequest,
    })
    this.clearMembers()
    await this.tearDown()

    // If teardown failed, do not proceed.
    if (this.teardownFailed) return

    // Mark the session as ended.
    this._state = 'ended'
    member.emit('session-ended', {
      data: { sessionId: this._id },
      request: fulfilledRequest,
    })
    this.destroy()
  }

  /**
   * Called when a member requests to reset the session.
   * @param member The member requesting to reset the session.
   * @param event The event emitted by the member.
   */
  public onRequestReset = async (
    member: ServerSessionMember,
    event: TClientEvents['request-reset-session'],
    // Build request for response data.
  ): Promise<void> => {
    let fulfilledRequest = member.connection.buildResponseReqData(event, {
      fulfilled: true,
    })
    let unfulfilledRequest = member.connection.buildResponseReqData(event, {
      fulfilled: false,
    })

    // If the member does not have the correct permissions
    // to start the session, then emit an error.
    if (!member.isAuthorized('startEndSessions')) {
      return member.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
          { request: fulfilledRequest },
        ),
      )
    }
    // If the session has not been started
    // then emit an error.
    if (this._state === 'unstarted') {
      return member.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_CONFLICTING_STATE,
          { request: fulfilledRequest },
        ),
      )
    }

    this._state = 'resetting'
    this.emitToAll('session-resetting', {
      data: {},
      request: unfulfilledRequest,
    })

    // Perform teardown.
    await this.tearDown()
    // If teardown failed, do not proceed.
    if (this.teardownFailed) return

    // Assign a new instance ID.
    this._instanceId = StringToolbox.generateRandomId()

    // Recreate the new mission from the JSON of
    // the current mission.
    this._mission = ServerMission.fromSaveJson(this.mission.toSaveJson())
    this.initializeMission()
    this.mapActions()
    // Reset setup and teardown results for the
    // new instance.
    this.setupResults = []
    this.teardownResults = []

    // Perform setup.
    await this.setUp()
    // If setup failed, do not proceed.
    if (this.setupFailed) return

    // Mark as started and emit the response to
    // all members.
    this._state = 'started'
    this.emitStartResponses(event, member, 'session-reset')

    // Perform any effect triggered by session start.
    this.applyMissionEffects('session-start')
  }

  /**
   * Called when a member requests to update the configuration
   * for the session.
   * @param member The member requesting to update the configuration.
   * @param event The event emitted by the member.
   */
  public onRequestConfigUpdate = (
    member: ServerSessionMember,
    event: TClientEvents['request-config-update'],
  ): void => {
    // Build request for response data.
    let request = member.connection.buildResponseReqData(event)
    // Parse data from event.
    let { config: configUpdates } = event.data

    // If the member does not have the correct permissions
    // to start the session, then emit an error.
    if (!member.isAuthorized('configureSessions')) {
      return member.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
          { request },
        ),
      )
    }
    // If the session is not in the 'unstarted' state,
    // then emit an error.
    if (this._state !== 'unstarted') {
      return member.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_CONFLICTING_STATE,
          { request },
        ),
      )
    }

    // Assign the new configuration to the session.
    Object.assign(this._config, configUpdates)
    // Update the session name if it has changed.
    if (this.name !== configUpdates.name && configUpdates.name) {
      this.name = configUpdates.name
    }

    // Emit an event to all users that the session configuration
    // has been updated.
    this.emitToAll('session-config-updated', {
      data: { config: this.config },
      request,
    })
  }

  /**
   * Called when a member requests to kick another member from the session.
   * @param member The member requesting to kick another member.
   * @param event The event emitted by the member.
   */
  public onRequestKick = (
    member: ServerSessionMember,
    event: TClientEvents['request-kick'],
  ): void => {
    // Build request for response data.
    let request = member.connection.buildResponseReqData(event)
    // Parse data from event.
    const { memberId: targetMemberId } = event.data
    // Get the target member to kick.
    const targetMember = this.getMember(targetMemberId)

    // If the member requesting does not have the
    // correct permissions to kick participants,
    // then emit an error.
    if (!member.isAuthorized('manageSessionMembers')) {
      return member.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
          { request },
        ),
      )
    }
    // If the target member is not found, then emit
    // an error.
    if (!targetMember) {
      return member.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_MEMBER_NOT_FOUND, {
          request,
        }),
      )
    }
    // If the target member has the `manageSessionMembers`
    // permission, then they cannot be kicked.
    if (targetMember.isAuthorized('manageSessionMembers')) {
      return member.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
          {
            request,
          },
        ),
      )
    }

    // Remove the member from the list.
    this._members = this._members.filter(
      (member) => member._id !== targetMember._id,
    )
    // Remove session-specific listeners.
    this.removeListeners(targetMember)
    // Handle quitting the session for the member.
    targetMember.connection.login.onMetisSessionQuit()

    // Emit an event to the target member and to the
    // requester that the target member has been kicked.
    let payload = {
      data: {
        sessionId: this._id,
        memberId: targetMemberId,
        userId: targetMember.userId,
      },
      request,
    }
    member.emit('kicked', payload)
    targetMember.emit('kicked', payload)
    // Emit an event to all users that the user list
    // has changed.
    this.emitToAll('session-members-updated', {
      data: {
        members: this.members.map((member) => member.toJson()),
      },
    })
  }

  /**
   * Called when a member requests to ban another member from the session.
   * @param member The member requesting to ban another member.
   * @param event The event emitted by the member.
   */
  public onRequestBan = (
    member: ServerSessionMember,
    event: TClientEvents['request-ban'],
  ): void => {
    // Build request for response data.
    let request = member.connection.buildResponseReqData(event)
    // Parse data from event.
    const { memberId: targetMemberId } = event.data
    // Get the target member to ban.
    const targetMember = this.getMember(targetMemberId)

    // If the member requesting does not have the
    // correct permissions to ban participants,
    // then emit an error.
    if (!member.isAuthorized('manageSessionMembers')) {
      return member.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
          { request },
        ),
      )
    }
    // If the target member is not found, then emit
    // an error.
    if (!targetMember) {
      return member.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_MEMBER_NOT_FOUND, {
          request,
        }),
      )
    }
    // If the target member has the `manageSessionMembers`
    // permission, then they cannot be banned.
    if (targetMember.isAuthorized('manageSessionMembers')) {
      return member.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
          {
            request,
          },
        ),
      )
    }

    // Add the user to the ban list.
    this._banList.push(targetMember.userId)
    // Remove the member from the list.
    this._members = this._members.filter(
      (member) => member._id !== targetMember._id,
    )
    // Remove session-specific listeners.
    this.removeListeners(targetMember)
    // Handle quitting the session for the member.
    targetMember.connection.login.onMetisSessionQuit()

    // Emit an event to the target member and to the
    // requester that the target member has been banned.
    let payload = {
      data: {
        sessionId: this._id,
        memberId: targetMemberId,
        userId: targetMember.userId,
      },
      request,
    }
    member.emit('banned', payload)
    targetMember.emit('banned', payload)
    // Emit an event to all users that the user list
    // has changed.
    this.emitToAll('session-members-updated', {
      data: {
        members: this.members.map((member) => member.toJson()),
      },
    })
  }

  /**
   *  Called when a member requests to assign another member to a force.
   * @param member The member requesting to assign another member to a force.
   * @param event The event emitted by the member.
   */
  public onRequestAssignForce = (
    member: ServerSessionMember,
    event: TClientEvents['request-assign-force'],
  ): void => {
    // Build request for response data.
    let request = member.connection.buildResponseReqData(event)
    // Parse data from event.
    const { memberId: targetMemberId, forceId } = event.data
    // Get the target member to assign.
    const targetMember = this.getMember(targetMemberId)

    // If the member requesting does not have the
    // correct permissions to assign forces,
    // then emit an error.
    if (!member.isAuthorized('manageSessionMembers')) {
      return member.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
          { request },
        ),
      )
    }
    // If the target member is not found, then emit
    // an error.
    if (!targetMember) {
      return member.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_MEMBER_NOT_FOUND, {
          request,
        }),
      )
    }
    // If the target member does not have the permission
    // to be assigned to a force, then emit an error.
    if (!targetMember.isAuthorized('forceAssignable')) {
      return member.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
          {
            request,
          },
        ),
      )
    }

    // Assign the target member to the force.
    targetMember.forceId = forceId

    // Update the target member's force assignment.
    if (forceId === null) {
      delete this.assignments[targetMember.userId]
    } else {
      let assignment = this.assignments[targetMember.userId] ?? {}
      assignment.forceId = forceId
      this.assignments[targetMember.userId] = assignment
    }

    // Emit a response that the assignment has
    // been made.
    member.emit('force-assigned', {
      data: { sessionId: this._id, memberId: targetMemberId, forceId },
      request,
    })

    // Emit to all members that the user list has changed.
    this.emitToAll('session-members-updated', {
      data: {
        members: this.members.map((member) => member.toJson()),
      },
    })
  }

  /**
   * Called when a member requests to assign a role to another member.
   * @param member The member requesting to assign a role to another member.
   * @param event The event emitted by the member.
   */
  public onRequestAssignRole = (
    member: ServerSessionMember,
    event: TClientEvents['request-assign-role'],
  ): void => {
    // Build request for response data.
    let request = member.connection.buildResponseReqData(event)
    // Parse data from event.
    const { memberId: targetMemberId, roleId } = event.data
    // Get the target member to assign.
    const targetMember = this.getMember(targetMemberId)

    // If the member requesting does not have the
    // correct permissions to assign roles,
    // then emit an error.
    if (!member.isAuthorized('manageSessionMembers')) {
      return member.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
          { request },
        ),
      )
    }
    // If the target member is not found, then emit
    // an error.
    if (!targetMember) {
      return member.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_MEMBER_NOT_FOUND, {
          request,
        }),
      )
    }
    // If the target member has the `manageSessionMembers`
    // permission, then they cannot have their role
    // changed.
    if (targetMember.isAuthorized('manageSessionMembers')) {
      return member.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
          {
            request,
          },
        ),
      )
    }

    // Assign the target member to the role.
    targetMember.role = MemberRole.get(roleId)

    // Update the target member's role assignment.
    let assignment = this.assignments[targetMember.userId] ?? {}
    assignment.roleId = roleId
    this.assignments[targetMember.userId] = assignment

    // Emit a response that the assignment has
    // been made.
    member.emit('role-assigned', {
      data: { sessionId: this._id, memberId: targetMemberId, roleId: roleId },
      request,
    })

    // Emit to all members that the user list has changed.
    this.emitToAll('session-members-updated', {
      data: {
        members: this.members.map((member) => member.toJson()),
      },
    })
  }

  /**
   * Called when a member requests to open a node.
   * @param member The member requesting to open a node.
   * @param event The event emitted by the member.
   */
  public onRequestOpenNode = (
    member: ServerSessionMember,
    event: TClientEvents['request-open-node'],
  ): void => {
    // Organize data.
    let mission: ServerMission = this.mission
    let { connection } = member
    let { nodeId } = event.data

    // If the member doesn't have the permission
    // to manipulate nodes, then emit an error.
    if (!member.isAuthorized('manipulateNodes')) {
      return connection.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
          {
            request: connection.buildResponseReqData(event),
          },
        ),
      )
    }

    // Find the node, given the ID.
    let node: ServerMissionNode | undefined = mission.getNodeById(nodeId)

    // If the session is not in the 'started' state,
    // then emit an error.
    if (this.state !== 'started') {
      return connection.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_CONFLICTING_STATE,
          {
            request: connection.buildResponseReqData(event),
          },
        ),
      )
    }
    // If the node is undefined, then emit
    // an error.
    if (node === undefined) {
      return connection.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_NODE_NOT_FOUND, {
          request: connection.buildResponseReqData(event),
        }),
      )
    }
    // If the member doesn't belong to the node's force and doesn't
    // have complete visibility, then emit an error.
    if (
      !member.isAuthorized('completeVisibility') &&
      member.forceId !== node.forceId
    ) {
      return connection.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
          {
            request: connection.buildResponseReqData(event),
          },
        ),
      )
    }
    // If the node is executable, then emit
    // an error.
    if (!node.openable) {
      return connection.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_NODE_NOT_OPENABLE, {
          request: connection.buildResponseReqData(event),
        }),
      )
    }

    try {
      node.openState(true)

      // Extract data from the node.
      const {
        revealedStructure: structure,
        revealedDescendants: descendants,
        revealedDescendantPrototypes: prototypes,
      } = node

      // Construct open event payload.
      //
      // Note: Currently, a shared payload works because
      // all members get the same node data as long as
      // they have visibility for that force. If this ever
      // changes, and node visibility varies member to member
      // of a force, this logic will need to be updated to
      // emit different payloads to different members.
      let payload: TServerEvents['node-opened'] = {
        method: 'node-opened',
        data: {
          _id: nodeId,
          forceId: node.forceId,
          opened: true,
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
        },
        request: { event, requesterId: member.userId, fulfilled: true },
      }

      // Emit open event.
      for (let { connection } of this.getMembersForForce(node.force._id)) {
        connection.emit('node-opened', payload)
      }
    } catch (error) {
      // Emit an error if the node could not be opened.
      connection.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_SERVER_ERROR, {
          request: connection.buildResponseReqData(event),
          message: 'Failed to open node.',
        }),
      )
    }
  }

  /**
   * Called when a member requests to execute an action on a node.
   * @param member The member requesting to execute an action.
   * @param event The event emitted by the member.
   * @resolves When the action has been executed or a client error is found.
   */
  public onRequestExecuteAction = async (
    member: ServerSessionMember,
    event: TClientEvents['request-execute-action'],
  ): Promise<void> => {
    // Gather data.
    let { config } = this
    let { connection } = member
    let { actionId, cheats = {} } = event.data
    let action: ServerMissionAction | undefined = this.actions.get(actionId)
    let request = connection.buildResponseReqData(event)

    // Clear the cheats if the member is not authorized
    // to use them.
    if (!member.isAuthorized('cheats')) cheats = {}

    // If the member doesn't have the permission
    // to manipulate nodes, then emit an error.
    if (!member.isAuthorized('manipulateNodes')) {
      return connection.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
          {
            request,
          },
        ),
      )
    }

    // If the session is not in the 'started' state,
    // then emit an error.
    if (this.state !== 'started') {
      return connection.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_CONFLICTING_STATE,
          {
            request,
          },
        ),
      )
    }
    // If the action is undefined, then emit
    // an error.
    if (action === undefined) {
      return connection.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_ACTION_NOT_FOUND, {
          request,
        }),
      )
    }
    // If the member doesn't belong to the action's force and doesn't
    // have complete visibility, then emit an error.
    if (
      !member.isAuthorized('completeVisibility') &&
      member.forceId !== action.force._id
    ) {
      return connection.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
          {
            request,
          },
        ),
      )
    }
    // If the action is not executable, then
    // emit an error.
    if (!action.node.executable) {
      return connection.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_NODE_NOT_EXECUTABLE, {
          request,
        }),
      )
    }
    // If the node is not revealed, then
    // emit an error.
    if (!action.node.revealed) {
      return connection.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_NODE_NOT_REVEALED, {
          request,
        }),
      )
    }
    // If the participant does not have enough
    // resources to execute the action, then
    // emit an error.
    if (!this.areEnoughResources(action, cheats)) {
      return connection.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_ACTION_INSUFFICIENT_RESOURCES,
          {
            request,
          },
        ),
      )
    }
    // If the action has exceeded its maximum
    // number of executions, then emit an error.
    if (action.executionLimitReached) {
      return connection.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_ACTION_EXECUTION_LIMIT, {
          request,
        }),
      )
    }

    try {
      // Execute the action, awaiting result.
      let outcome = await action.execute({
        sessionConfig: config,
        cheats,
        onInit: (execution: ServerActionExecution) =>
          this.onExecution(member, request, execution),
      })

      // Handle the outcome of the action.
      this.onOutcome(member, request, outcome)
    } catch (error) {
      // Emit an error if the action could not be executed.
      connection.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_SERVER_ERROR, {
          request: connection.buildResponseReqData(event),
          message: 'Failed to execute action.',
        }),
      )
    }
  }

  /**
   * Called when a member requests to acknowledge a node alert.
   * @param member The member acknowledging the node alert.
   * @param event The event emitted by the member.
   */
  private onRequestAcknowledgeNodeAlert = (
    member: ServerSessionMember,
    event: TClientEvents['request-acknowledge-node-alert'],
  ): void => {
    try {
      this.requireSessionState(member, event, 'started')

      let { nodeId, alertId } = event.data
      let node = this.mission.getNodeById(nodeId)
      let alert = node?.getAlert(alertId)
      let request = this.buildFullfilledRequest(member, event)

      if (!node || !alert) {
        return member.emitError(
          new ServerEmittedError(ServerEmittedError.CODE_NODE_ALERT_NOT_FOUND, {
            request,
          }),
        )
      }

      // Ensure the member belongs to the node's force or has complete
      // visibility before allowing the acknowledgement.
      if (
        !member.isAuthorized('completeVisibility') &&
        member.forceId !== node.forceId
      ) {
        return member.emitError(
          new ServerEmittedError(
            ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
            { request },
          ),
        )
      }

      alert.acknowledged = true

      // Communicate with all members of the force
      // that the alert has now been acknowledged.
      for (let { connection } of this.getMembersForForce(node.forceId)) {
        connection.emit('node-alert-acknowledged', {
          method: 'node-alert-acknowledged',
          data: event.data,
          request,
        })
      }
    } catch (error) {
      // Emit an error if the action could not be executed.
      member.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_SERVER_ERROR, {
          request: member.connection.buildResponseReqData(event),
          message: 'Failed to acknowledge node alert.',
        }),
      )
    }
  }

  /**
   * Sub-handler of `onRequestExecuteAction` which processes the
   * initiation of an action execution.
   * @param member The member provided to `onRequestExecuteAction`.
   * @param event The event provided to `onRequestExecuteAction`.
   * @param execution The execution that was initiated.
   */
  private onExecution(
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
    // to each member.
    for (let member of this.getMembersForForce(action!.force._id)) {
      member.emit('action-execution-initiated', initiationPayload)
    }

    // Create a new output JSON object.
    let message = /*html*/ `
              <p>Executing <i><action-name></action-name></i> on <i><node-name></node-name></i>.</p>
              <i><action-description></action-description></i>
            `

    // Send the output JSON to the force.
    this.sendOutput(
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
  private onOutcome(
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
    for (let { connection } of this.getMembersForForce(outcome.forceId)) {
      connection.emit('action-execution-completed', completionPayload)
    }

    // Apply effects, if the outcome calls for it.
    if (effectTrigger)
      this.applyActionEffects(member, action, effectTrigger, outcome.execution)
  }

  /**
   * Called when a member requests to send an output.
   * @param member The member requesting to send an output.
   * @param event The event emitted by the member.
   */
  public onRequestSendOutput = (
    member: ServerSessionMember,
    event: TClientEvents['request-send-output'],
  ): void => {
    // Gather details.
    let { key } = event.data
    let request = member.connection.buildResponseReqData(event)

    // If the session is not in the 'started' state,
    // then emit an error.
    if (this.state !== 'started') {
      return member.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_CONFLICTING_STATE,
          {
            request,
          },
        ),
      )
    }

    switch (key) {
      case 'pre-execution':
        // Extract the node ID from the event data.
        let { nodeId } = event.data

        // Find the node given the ID.
        let node: ServerMissionNode | undefined =
          this.mission.getNodeById(nodeId)

        // If the node is undefined, then emit
        // an error.
        if (node === undefined) {
          return member.emitError(
            new ServerEmittedError(ServerEmittedError.CODE_NODE_NOT_FOUND, {
              request,
            }),
          )
        }

        // If the member doesn't belong to the node's force and doesn't
        // have complete visibility, then emit an error.
        if (
          !member.isAuthorized('completeVisibility') &&
          member.forceId !== node.forceId
        ) {
          return member.emitError(
            new ServerEmittedError(
              ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
              {
                request,
              },
            ),
          )
        }

        // If the node is not revealed, then
        // emit an error.
        if (!node.revealed) {
          return member.emitError(
            new ServerEmittedError(ServerEmittedError.CODE_NODE_NOT_REVEALED, {
              request,
            }),
          )
        }

        try {
          if (node.preExecutionText === '') {
            // Emit an event to the participant that the
            // pre-execution message was sent.
            member.emit('output-sent', {
              data: {
                key: 'pre-execution',
                nodeId,
              },
              request: {
                event,
                requesterId: member.userId,
                fulfilled: true,
              },
            })
            return
          }

          // Send an output to the force.
          this.sendOutput(
            member.outputPrefix,
            node.preExecutionText,
            { type: 'pre-execution', sourceNodeId: node._id },
            {
              force: node.force,
              member,
            },
          )

          // Emit an event to the participant that the
          // pre-execution message was sent.
          member.emit('output-sent', {
            data: {
              key: 'pre-execution',
              nodeId,
            },
            request: {
              event,
              requesterId: member.userId,
              fulfilled: true,
            },
          })
        } catch (error: any) {
          // Emit an error if the pre-execution message could not be sent.
          member.emitError(
            new ServerEmittedError(ServerEmittedError.CODE_SERVER_ERROR, {
              request,
              message: 'Failed to send pre-execution message.',
            }),
          )
        }
    }
  }

  /**
   * Called when a member requests to send a chat message to a channel.
   * @param member The member sending the message.
   * @param event The event emitted by the member.
   */
  public onRequestSendChatMessage = (
    member: ServerSessionMember,
    event: TClientEvents['request-send-chat-message'],
  ): void => {
    let request = member.connection.buildResponseReqData(event)
    let { channelId, message } = event.data

    // Only allow messaging in a started session.
    if (this._state !== 'started') {
      return member.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_CONFLICTING_STATE,
          { request },
        ),
      )
    }

    // Find the channel.
    let channel = this.getChatChannel(channelId)
    if (!channel) {
      return member.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_CHAT_CHANNEL_NOT_FOUND, {
          request,
        }),
      )
    }

    // Ensure the member is allowed to see (and therefore post to) the channel.
    if (!channel.canMemberSee(member)) {
      return member.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
          { request },
        ),
      )
    }

    // Generate and store the message.
    let chatMessage = ServerChatMessage.generate(channel, this, member, message)
    channel.messages.push(chatMessage)
    let messageJson = chatMessage.toJson()

    // Broadcast to all members who can see the channel.
    for (let recipient of this._members) {
      if (channel.canMemberSee(recipient)) {
        recipient.emit('chat-message-received', {
          data: { message: messageJson },
        })

        // Also emit a session panel alert and increment the unread count for recipients
        // who didn't send the message, but have received it.
        if (recipient._id !== member._id) {
          this.emitSessionPanelAlert(recipient, 'Messenger')
          this.incrementUnreadChatCount(recipient._id, channel._id)
        }
      }
    }

    // Confirm delivery to the sender.
    member.emit('chat-message-sent', {
      data: messageJson,
      request,
    })
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
   * Helper method to consolidate the logic between {@link onSetupScriptResolution}
   * and {@link onTeardownScriptResolution} methods.
   * @param destination The array to which the new results will be added.
   * @param eventMethod The event method to emit to session managers.
   * @param newResults The new results to process.
   */
  private onScriptResolution = (
    destination: EnvScriptResults[],
    eventMethod: 'session-setup-update' | 'session-teardown-update',
    ...newResults: EnvScriptResults[]
  ): void => {
    // Filter out non-erroneous results.
    let erroneousResults = newResults.filter(
      (result) => result.status === 'failure',
    ) as EnvScriptResults<'failure'>[]

    // If there are erroneous results...
    if (erroneousResults.length > 0) {
      for (let result of erroneousResults) {
        // Log each erroneous result.
        targetEnvLogger.error(
          `Environment hook "${result.environment.name}" failed with error:`,
          result.error,
        )
      }
    }

    // Store new hook results for later review.
    destination.push(...newResults)
    // Forward results to session managers.
    this.emitToRole('manager', eventMethod, {
      data: {
        results: newResults.map((result) => result.toJson()),
      },
    })
  }

  /**
   * Handler for when a target-environment setup script (hook or effect)
   * has completed its execution.
   * @param results The results of setup script executions.
   */
  private onSetupScriptResolution = (...results: EnvScriptResults[]): void => {
    this.onScriptResolution(
      this.setupResults,
      'session-setup-update',
      ...results,
    )
  }

  /**
   * Handler for when a target-environment teardown script (hook or effect)
   * has completed its execution.
   * @param results The results of teardown script executions.
   */
  private onTeardownScriptResolution = (
    ...results: EnvScriptResults[]
  ): void => {
    this.onScriptResolution(
      this.teardownResults,
      'session-teardown-update',
      ...results,
    )
  }

  /**
   * Applies an effect to its target script with the given context.
   * @param effect The effect to apply.
   * @param context The context for the target script.
   * @param locationMessage A message indicating the location of
   * the effect in the event there is an error.
   */
  private async applyEffect<TType extends TEffectType>(
    effect: ServerEffect<TType>,
    context: TargetScriptContext<TType>,
    locationMessage: string,
  ): Promise<EnvScriptResults> {
    // If the effect doesn't have a target environment,
    // log an error.
    if (effect.environment === null) {
      throw new Error(
        `"${effect.name}" doesn't have a target environment or the target environment doesn't exist.`,
      )
    }
    // If the effect doesn't have a target,
    // log an error.
    if (effect.target === null) {
      throw new Error(
        `"${effect.name}" doesn't have a target or the target doesn't exist.`,
      )
    }

    // Apply the effect to the target.
    try {
      if (!effect.hasIssues) {
        let promise = context.execute(effect.target.script)
        this.effectHistory.push(promise)
        await promise
        return EnvScriptResults.success(effect.environment)
      } else {
        return EnvScriptResults.skipped(effect.environment)
      }
    } catch (error: any) {
      if (!(error instanceof OutdatedContextError)) {
        targetEnvLogger.error(error)
      } else {
        // Give additional information about the error.
        let message =
          `Failed to apply effect - "${effect.name}" - to target - "${effect.target.name}" - found in the environment - "${effect.environment.name}".\n` +
          `The effect - "${effect.name}" - can be found here:\n` +
          `${locationMessage}\n`
        // Log the error.
        targetEnvLogger.error(message, error)
      }
      return EnvScriptResults.failure(effect.environment, error)
    }
  }

  /**
   * Processes the effects of the mission, enacting
   * those of the given trigger.
   * @param trigger The trigger to look for in the effects.
   */
  public async applyMissionEffects(
    trigger: TEffectSessionTriggered,
  ): Promise<EnvScriptResults[]> {
    // Map of triggers to valid session states.
    const triggerToStateMap: Record<TEffectSessionTriggered, TSessionState[]> =
      {
        'session-start': ['started'],
        'session-setup': ['starting', 'resetting'],
        'session-teardown': ['ending', 'resetting'],
      }

    // Get the effects for the given trigger.
    let effects = this.mission.effects
      .filter((effect) => effect.trigger === trigger)
      .filter((effect) => effect.environment)
      .sort((a, b) => a.order - b.order)
    let results: EnvScriptResults[] = []

    // Iterate through each effect and apply it.
    for (let effect of effects) {
      // Environment is guaranteed to be non-null
      // due to the filtering above.
      let environment: ServerTargetEnvironment = effect.environment!

      // Break if the session is no longer in the
      // correct state for the trigger.
      if (!triggerToStateMap[effect.trigger].includes(this.state)) {
        break
      }
      // Skip if the target environment is disabled
      if (this.config.disabledTargetEnvs.includes(environment._id)) {
        continue
      }

      let context = TargetScriptContext.createSessionContext(effect, this)
      let result = await this.applyEffect(
        effect,
        context,
        `mission - "${this.mission.name}" - effect - "${effect.name}".`,
      )
      results.push(result)
    }

    return results
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
    // Get the effects for the given trigger.
    let effects = action.effects
      .filter((effect) => effect.trigger === trigger)
      .sort((a, b) => a.order - b.order)

    // Iterate through each effect and apply it.
    for (let effect of effects) {
      // These effects should only be applied while the
      // session is in the 'started' state.
      if (this.state !== 'started') {
        break
      }
      // Skip if the target environment is disabled
      if (
        effect.environment &&
        this.config.disabledTargetEnvs.includes(effect.environmentId)
      ) {
        continue
      }

      // Create and expose a new context for the target
      // environment.
      let context = TargetScriptContext.createExecutionContext(
        effect,
        this,
        member,
        execution,
      )
      await this.applyEffect(
        effect,
        context,
        `force - "${effect.sourceForce.name}" - node - "${effect.sourceNode.name}" - action - "${effect.sourceAction.name}" - effect - "${effect.name}".`,
      )
    }
  }

  /**
   * Confirms the mission component is a part of the mission
   * the session is using.
   * @param component The component to check.
   * @throws If the component does not belong to the mission.
   */
  private confirmComponentInMission(
    component: MissionComponent<any, any>,
  ): void {
    if (!this.mission.has(component)) {
      throw new Error(
        `Could not perform the operation on the component with ID "${component._id}" because it does not belong to the mission with ID "${this.mission._id}".`,
      )
    }
  }

  /**
   * Confirms the mission components are a part of the mission
   * the session is using.
   * @param components The components to check. This can be multiple instances or arrays
   * of components. Allowing for multiple instances and arrays provides flexibility for
   * passing components from various sources without needing to consolidate them beforehand.
   * @throws If any component does not belong to the mission.
   */
  private confirmComponentsInMission(
    ...components: Array<TInstanceOrArray<MissionComponent<any, any>>>
  ): void {
    for (let component of ArrayToolbox.toArray(components.flat())) {
      this.confirmComponentInMission(component)
    }
  }

  /**
   *  Alerts a session member(s) that a panel has new activity and assists in tracking
   * which panels have pending alerts.
   * @param members The session member(s) to alert.
   * @param panel The panel tab that has new activity.
   */
  private emitSessionPanelAlert(
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
  private getSessionPanelAlerts(member: ServerSessionMember) {
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
  private clearSessionPanelAlert(
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
  private incrementUnreadChatCount(memberId: string, channelId: string): void {
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
  private clearUnreadChatCount(memberId: string, channelId: string): void {
    this._unreadChatChannelMessages.get(memberId)?.delete(channelId)
  }

  /**
   * Returns whether a member has any channels with unread messages.
   * @param memberId The ID of the member to check.
   */
  private hasPendingUnreadChatMessages(memberId: string): boolean {
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
   * Acknowledges a session panel alert by viewing the panel.
   * @param member The session member acknowledging the alert.
   * @param event The acknowledge event.
   */
  private onAcknowledgeSessionPanelAlert = (
    member: ServerSessionMember,
    event: TClientEvents['acknowledge-session-panel-alert'],
  ): void => {
    if (event.data.panel === 'Messenger') {
      this.clearUnreadChatCount(member._id, event.data.channelId)

      if (!this.hasPendingUnreadChatMessages(member._id)) {
        this.clearSessionPanelAlert(member, 'Messenger')
      }
    } else {
      this.clearSessionPanelAlert(member, event.data.panel)
    }
  }

  /**
   * Fetches the current session panel alerts for a member.
   * @param member The requesting session member.
   */
  private onFetchSessionPanelAlerts = (
    member: ServerSessionMember,
    _event: TClientEvents['fetch-session-panel-alerts'],
  ): void => {
    const panels = Array.from(
      this._pendingSessionPanelAlerts.get(member._id) ?? [],
    )
    if (panels.length) {
      member.emit('session-panel-alert', { data: { panels } })
    }
  }

  /**
   * Handles the blocking and unblocking of a node during a session.
   * @param nodeId The node to block or unblock.
   * @param blocked Whether to block or unblock the node.
   */
  public updateNodeBlockStatus = (
    nodes: ServerMissionNode[],
    blocked: boolean,
  ) => {
    this.confirmComponentsInMission(nodes)
    nodes.forEach((node) => (node.blocked = blocked))

    let batchMap = new ComponentModifierBatchMap(this, nodes)

    batchMap.emit('node-block-status-updated', (nodes) => ({
      data: {
        blocked,
        lookUpData: ArrayToolbox.mapProperties(nodes, ['_id', 'forceId']),
      },
    }))
  }

  /**
   * Updates the open/closed state of the provided nodes during an active session and notifies all members.
   * @param nodes The nodes whose open state should be changed.
   * @param open True to open the nodes (revealing descendants), false to close them (hiding descendants).
   * @note Nodes already in the desired state are skipped with a warning.
   * @note Nodes with `revealAllNodes` enabled cannot be opened or closed and will be skipped.
   */
  public updateNodeOpenState = (nodes: ServerMissionNode[], open: boolean) => {
    this.confirmComponentsInMission(nodes)

    // Filter to nodes where the operation is actually permitted.
    let validNodes = nodes.filter((node) => {
      if (open && !node.openable) {
        targetEnvLogger.warn(
          `Skipping open on node "${node.name}" (${node._id}): already opened or revealAllNodes enabled`,
        )
        return false
      } else if (!open && !node.closable) {
        targetEnvLogger.warn(
          `Skipping close on node "${node.name}" (${node._id}): already closed or revealAllNodes enabled`,
        )
        return false
      }
      return true
    })

    if (validNodes.length === 0) return

    // Perform the open/close operation on each valid node.
    validNodes.forEach((node) => node.openState(open))

    // Notify all members about the state changes.
    let batchMap = new ComponentModifierBatchMap(this, validNodes)
    batchMap.emit('node-open-state-updated', (batchNodes, members) => {
      let nodes = batchNodes.map((node) => {
        let {
          revealedStructure: structure,
          revealedDescendants: descendants,
          revealedDescendantPrototypes: prototypes,
        } = node
        return {
          _id: node._id,
          forceId: node.forceId,
          structure,
          revealedDescendants: descendants.map((n) =>
            n.toJson({
              sessionDataExposure: {
                expose: 'member-specific',
                memberId: members[0]._id,
              },
            }),
          ),
          revealedDescendantPrototypes: prototypes.map((p) => p.toJson()),
        }
      })
      return {
        data: {
          opened: open,
          nodes,
        },
      }
    })
  }

  /**
   * Adds an alert to the given node with the specified severity level.
   * @param node The node to which the alert will be added.
   * @param message The message to display when the alert is opened.
   * @param severityLevel The severity level of the alert, indicating
   * the importance/urgency of the alert.
   * @note By default, this will add the alert to the node to which the current
   * effect belongs, unless configured otherwise.
   */
  public addNodeAlert = (
    nodes: ServerMissionNode[],
    message: string,
    severityLevel: TNodeAlertSeverityLevel,
  ) => {
    this.confirmComponentsInMission(nodes)

    // Add the alert to each node and build a lookup map for batched emission.
    let alertIdMap = new Map<string, string>()
    for (let node of nodes) {
      alertIdMap.set(node._id, node.alert(message, severityLevel)._id)
    }

    let batchMap = new ComponentModifierBatchMap(this, nodes)
    batchMap.emit('node-alert-added', (nodes) => ({
      data: {
        message,
        severityLevel,
        ids: nodes.map((node) => ({
          nodeId: node._id,
          alertId: alertIdMap.get(node._id)!,
        })),
      },
    }))
  }

  /**
   * Applies a modifier to one or more actions and emits a batch event.
   * @param actions The actions to modify.
   * @param modifier The modifier to apply.
   */
  private modifyActions = (
    actions: ServerMissionAction[],
    modifier: TActionModifier,
  ): void => {
    let method = ServerMissionAction.getServerMethodForModifier(modifier)

    this.confirmComponentsInMission(actions)
    actions.forEach((action) => action.applyModifier(modifier))

    let batchMap = new ComponentModifierBatchMap(this, actions)
    batchMap.emit(method, (actions) => ({
      data: {
        lookUpData: ArrayToolbox.mapProperties(actions, [
          '_id',
          'forceId',
          'nodeId',
        ]),
        modifier,
      },
    }))
  }

  /**
   * Modifies the success chance of one or more actions.
   * @param actions The actions to modify.
   * @param operand The operand to modify the success chance by.
   */
  public modifySuccessChance = (
    actions: ServerMissionAction[],
    operand: number,
  ) => {
    let appliedAt = Date.now()
    let modifier: TActionModifier = {
      type: 'success-chance',
      amount: operand,
      appliedAt,
      resourceId: null,
    }
    this.modifyActions(actions, modifier)
  }

  /**
   * Modifies the processing time of one or more actions.
   * @param actions The actions to modify.
   * @param operand The operand to modify the processing time by.
   */
  public modifyProcessTime = (
    actions: ServerMissionAction[],
    operand: number,
  ) => {
    let appliedAt = Date.now()
    let modifier: TActionModifier = {
      type: 'process-time',
      amount: operand,
      appliedAt,
      resourceId: null,
    }
    this.modifyActions(actions, modifier)
  }

  /**
   * Modifies the resource cost of one or more actions.
   * @param actions The actions to modify.
   * @param resourceId The ID of the resource whose cost to modify.
   * @param operand The operand to modify the resource cost by.
   */
  public modifyResourceCost = (
    actions: ServerMissionAction[],
    resourceId: string,
    operand: number,
  ) => {
    let appliedAt = Date.now()
    let modifier: TActionModifier = {
      type: 'resource-cost',
      amount: operand,
      appliedAt,
      resourceId,
    }
    this.modifyActions(actions, modifier)
  }

  /**
   * Modifies one or more resource pools by applying the given amount
   * to each pool.
   * @param pools The resource pools to modify.
   * @param operand The amount by which to modify each resource pool.
   * @note A negative value will subtract and a positive
   * value will add to each resource pool.
   */
  public modifyResourcePool = (
    pools: ServerResourcePool[],
    operand: number,
  ) => {
    this.confirmComponentsInMission(pools)
    pools.forEach((pool) => pool.onModify(operand))

    // Send update to client connections to keep them
    // synced with the server.
    let batchMap = new ComponentModifierBatchMap(this, pools)
    batchMap.emit('resource-pool-updated', (pools) => ({
      data: {
        lookUpData: ArrayToolbox.mapProperties(pools, ['_id', 'forceId']),
        operand,
      },
    }))
  }

  /**
   * Updates access to the given files in the mission for the given forces.
   * @param forces The forces which will have their access modified.
   * @param files The files to which access is granted/revoked.
   * @param granted Whether access is granted or revoked.
   */
  public updateFileAccess = (
    forces: ServerMissionForce[],
    files: ServerMissionFile[],
    granted: boolean,
  ): void => {
    this.confirmComponentsInMission(files, forces)
    forces.forEach((force) => force.updateFileAccess(files, granted))

    let batchMap = new ComponentModifierBatchMap(this, forces)

    batchMap.emit('file-access-updated', (forces) => ({
      data: {
        granted,
        forceIds: forces._ids,
        files: files.map((file) => file.toJson()),
      },
    }))

    if (granted) {
      batchMap.emitMemberSpecific('session-panel-alert', (forces, member) => {
        let panels = this.getSessionPanelAlerts(member)
        panels.add('Files')
        return {
          data: {
            panels: [...panels],
          },
        }
      })
    }
  }

  // todo: Test this method to make sure complete-visibility
  // todo: members don't receive duplicate outputs.
  /**
   * Sends an output to the force's output panel.
   * @param output The output to send to the force.
   * @param options Options for sending the output.
   */
  public sendOutput = (
    prefix: string,
    message: string,
    context: TOutputContext,
    to?: TOutputTo,
  ) => {
    // Extract data.
    const { type } = context
    let forceRecipients: ServerMissionForce[] = []
    let member: ServerSessionMember | undefined = to?.member

    // Mark all forces as recipients if
    // no recipient is specified.
    if (!to) {
      forceRecipients = this.mission.forces
    }
    // Mark only the specified force as recipient,
    // otherwise.
    else {
      forceRecipients = [to.force]
    }

    // Loop through any forceRecipients and send the
    // output to each.
    for (let force of forceRecipients) {
      // Create a new output object.
      let output = ServerOutput.generate(
        force,
        prefix,
        message,
        context,
        to?.member?._id,
      )

      // Store the output in the force.
      force.storeOutput(output)

      // If a member is specified, send the output to that member.
      // Also send to any members with complete visibility (e.g. admins)
      // who are not the targeted member so they see it in real-time.
      if (member) {
        const outputJson = output.toJson()
        member.emit('send-output', {
          data: {
            outputData: outputJson,
          },
        })
        this.emitSessionPanelAlert(member, 'Output')
        continue
      }

      // Otherwise, send the output to all members
      // of the force.
      ServerSessionMember.emitToGroup(
        this.getMembersForForce(force._id),
        'send-output',
        {
          data: {
            outputData: output.toJson(),
          },
        },
      )
      this.emitSessionPanelAlert(this.getMembersForForce(force._id), 'Output')
    }
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
