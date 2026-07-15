import type { ServerConnection } from '@client/connect/ServerConnection'
import { ClientActionCost } from '@client/missions/actions/ClientActionCost'
import type { ClientActionExecution } from '@client/missions/actions/ClientActionExecution'
import type { ClientMissionAction } from '@client/missions/actions/ClientMissionAction'
import { ClientMission } from '@client/missions/ClientMission'
import type { ClientMissionNode } from '@client/missions/nodes/ClientMissionNode'
import { ClientSessionRealm } from '@client/sessions/ClientSessionRealm'
import { ClientEnvironmentTask } from '@client/target-environments/ClientEnvironmentTask'
import { Logging } from '@client/toolbox/Logging'
import { ClientUser } from '@client/users/ClientUser'
import type {
  TNodeOpenStateData,
  TResponseEvents,
  TSessionPanelAlert,
} from '@shared/connect'
import type { TExecutionCheats } from '@shared/missions/actions/ActionExecution'
import type { TChatChannelJson } from '@shared/sessions/chat/ChatChannel'
import type {
  MemberRole,
  TMemberRoleId,
} from '@shared/sessions/members/MemberRole'
import type { TSessionMemberJson } from '@shared/sessions/members/SessionMember'
import type {
  TSessionBasicJson,
  TSessionConfig,
  TSessionJson,
} from '@shared/sessions/MissionSession'
import { MissionSession } from '@shared/sessions/MissionSession'
import type { TSessionRealmJson } from '@shared/sessions/SessionRealm'
import type { TEnvironmentTaskJson } from '@shared/target-environments/TargetEnvironmentTask'
import type { TInstanceOrArray } from '@shared/toolbox/arrays/ArrayToolbox'
import { ArrayToolbox } from '@shared/toolbox/arrays/ArrayToolbox'
import axios from 'axios'
import type { TMetisClientComponents } from '..'
import { ClientChatChannel } from './chat/ClientChatChannel'
import { ClientSessionMember } from './ClientSessionMember'
import { SessionBasic } from './SessionBasic'
import { SessionRealmBasic } from './SessionRealmBasic'
import { onActionExecutionCompleted } from './traffic-controllers/onActionExecutionCompleted'
import { onActionExecutionInitiated } from './traffic-controllers/onActionExecutionInitiated'
import { onActionModifierUpdated } from './traffic-controllers/onActionModifierUpdated'
import { onBanned } from './traffic-controllers/onBanned'
import { onChatMessageReceived } from './traffic-controllers/onChatMessageReceived'
import { onConfigUpdate } from './traffic-controllers/onConfigUpdate'
import { onDestroyed } from './traffic-controllers/onDestroyed'
import { onDismissed } from './traffic-controllers/onDismissed'
import { onEnd } from './traffic-controllers/onEnd'
import { onEnding } from './traffic-controllers/onEnding'
import { onFileAccessUpdated } from './traffic-controllers/onFileAccessUpdated'
import { onForceAssigned } from './traffic-controllers/onForceAssigned'
import { onKicked } from './traffic-controllers/onKicked'
import { onMembersUpdate } from './traffic-controllers/onMembersUpdate'
import { onNodeAlertAcknowledged } from './traffic-controllers/onNodeAlertAcknowledged'
import { onNodeAlertAdded } from './traffic-controllers/onNodeAlertAdded'
import { onNodeBlockStatusUpdated } from './traffic-controllers/onNodeBlockStatusUpdated'
import { onNodeOpenedResponse } from './traffic-controllers/onNodeOpenedResponse'
import { onNodeOpenStateUpdated } from './traffic-controllers/onNodeOpenStateUpdated'
import { onOutputSent } from './traffic-controllers/onOutputSent'
import { onQuit } from './traffic-controllers/onQuit'
import { onReset } from './traffic-controllers/onReset'
import { onResourcePoolUpdated } from './traffic-controllers/onResourcePoolUpdated'
import { onRoleAssigned } from './traffic-controllers/onRoleAssigned'
import { onSendOutput } from './traffic-controllers/onSendOutput'
import { onStart } from './traffic-controllers/onStart'
import { onStarting } from './traffic-controllers/onStarting'
import { onTaskUpdate } from './traffic-controllers/onTaskUpdate'

/**
 * Client instance for sessions. Handles client-side logic for sessions. Communicates with server to conduct a session.
 */
export class SessionClient extends MissionSession<TMetisClientComponents> {
  /**
   * The server connection used to communicate with the server.
   */
  protected server: ServerConnection

  /**
   * The ID of the member for this client connection.
   */
  private memberId: ClientSessionMember['_id']

  /**
   * The session member for this client connection.
   */
  public get member(): ClientSessionMember {
    // Find the member associated with this client connection.
    let member = this.getMember(this.memberId)

    // Throw an error if the member could not
    // be found in the members JSON passed.
    if (!member) {
      throw new Error('Member not found in session.')
    }

    // Return the member.
    return member
  }

  /**
   * The role of the member associated with this client connection.
   */
  public get role(): MemberRole {
    return this.member.role
  }

  /**
   * The role ID of the member associated with this client connection.
   */
  public get roleId(): TMemberRoleId {
    return this.member.roleId
  }

  /**
   * The realm to which {@link member} is subscribed.
   */
  public get subscribedRealm(): ClientSessionRealm {
    return this.member.subscribedRealm
  }

  /**
   * Shallow, mission-free summaries of every realm in the session. Present
   * only for members with complete visibility; empty otherwise. Used to
   * populate realm-switching UI without loading each realm's full mission.
   * @note The member's own realm is held in full via {@link subscribedRealm};
   * this list is purely for listing and switching between realms.
   */
  protected _realmBasics: SessionRealmBasic[] = []
  public get realmBasics(): SessionRealmBasic[] {
    return [...this._realmBasics]
  }

  /**
   * The mission instance within the {@link subscribedRealm} which
   * the member is currently using.
   */
  public get subscribedMission(): ClientMission {
    return this.subscribedRealm.mission
  }

  /**
   * Private cache for {@link defaultRealm}.
   */
  private _defaultRealm?: ClientSessionRealm
  // Implemented
  public get defaultRealm(): ClientSessionRealm {
    if (!this._defaultRealm) {
      this._defaultRealm = ClientSessionRealm.createNew(
        MissionSession.DEFAULT_REALM_NAME,
        this,
        { _id: MissionSession.DEFAULT_REALM_ID },
      )
    }
    return this._defaultRealm
  }

  /**
   * Unread chat message count per chat channel.
   */
  protected _unreadChatMessageCount: Map<string, number>

  /**
   * Pending session panel alerts at the time the session was joined or fetched.
   */
  private _initialPendingSessionPanelAlerts: TSessionPanelAlert[]
  /**
   * The session panel alerts that had unacknowledged activity when this
   * session was joined or fetched.
   */
  public get pendingSessionPanelAlerts(): TSessionPanelAlert[] {
    return this._initialPendingSessionPanelAlerts
  }

  /**
   * @see {@link activeExecutions}
   */
  protected _activeExecutions: ClientActionExecution[]

  /**
   * Executions that are currently active in this session.
   */
  public get activeExecutions(): ClientActionExecution[] {
    return [...this._activeExecutions]
  }

  /**
   * Returns all chat channels that the member can see.
   */
  public get memberChatChannels(): ClientChatChannel[] {
    let { assignedForceId, role } = this.member
    let hasCompleteVisibility = role.isAuthorized('completeVisibility')

    return this._chatChannels.filter((channel) =>
      channel.canSee(assignedForceId, hasCompleteVisibility),
    )
  }

  /**
   * Whether the member has any unread chat messages.
   */
  public get memberHasUnreadChatMessages(): boolean {
    return this.memberChatChannels.some(
      (channel) => this.getUnreadChatMessageCount(channel._id) > 0,
    )
  }

  /**
   * Tracks the timeout which ticks active executions.
   */
  private activeExecutionTimeout: number | null = null

  /**
   * This is a registry, not of active listeners, but the
   * methods and corresponding traffic controllers for all
   * listeners that should be added and removed via the
   * {@link addListeners} and {@link removeListeners} methods.
   * This helps ensure there is no mismatch in adding and
   * removing listeners, such as adding a listener and
   * forgetting to remove it, or vice versa.
   */
  private get listenerInputRegistry() {
    return [
      ['session-starting', onStarting],
      ['session-started', onStart],
      ['session-ending', onEnding],
      ['session-ended', onEnd],
      ['session-reset', onReset],
      ['session-config-updated', onConfigUpdate],
      ['session-members-updated', onMembersUpdate],
      ['session-task-update', onTaskUpdate],
      ['force-assigned', onForceAssigned],
      ['role-assigned', onRoleAssigned],
      ['node-opened', onNodeOpenedResponse],
      ['action-execution-initiated', onActionExecutionInitiated],
      ['action-execution-completed', onActionExecutionCompleted],
      ['node-open-state-updated', onNodeOpenStateUpdated],
      ['node-block-status-updated', onNodeBlockStatusUpdated],
      ['file-access-updated', onFileAccessUpdated],
      ['resource-pool-updated', onResourcePoolUpdated],
      ['send-output', onSendOutput],
      ['output-sent', onOutputSent],
      ['node-alert-acknowledged', onNodeAlertAcknowledged],
      ['node-alert-added', onNodeAlertAdded],
      ['action-process-time-updated', onActionModifierUpdated],
      ['action-success-chance-updated', onActionModifierUpdated],
      ['action-resource-cost-updated', onActionModifierUpdated],
      ['kicked', onKicked],
      ['banned', onBanned],
      ['dismissed', onDismissed],
      ['session-destroyed', onDestroyed],
      ['session-quit', onQuit],
      ['chat-message-received', onChatMessageReceived],
    ] as const
  }

  /**
   * @param data Core data used to build the session object.
   * @param server The connection to the server used to synchronize
   * game logic.
   * @param memberId The ID of the member associated with this
   * client connection.
   */
  public constructor(
    data: TSessionJson,
    server: ServerConnection,
    memberId: string,
  ) {
    // Gather details.
    let mission: ClientMission = ClientMission.fromExistingJson(data.mission, {
      nonRevealedDisplayMode: 'blur',
    })
    let {
      _id,
      state,
      name,
      ownerId,
      ownerUsername,
      ownerFirstName,
      ownerLastName,
      launchedAt,
      realms: realmData,
      realmBasics: realmBasicData,
      members: memberData,
      config,
      environmentTasks: environmentTaskData,
      chatChannels,
      unreadChatChannelMessages,
      pendingSessionPanelAlerts,
    } = data

    // Call super constructor with base data. Realms, members, environment
    // tasks, and chat channels are deserialized by the base constructor
    // through the parseX hooks implemented below, each of which binds the
    // parsed objects to this session.
    super(
      _id,
      name,
      ownerId,
      ownerUsername,
      ownerFirstName,
      ownerLastName,
      new Date(launchedAt),
      config,
      mission,
      realmData,
      memberData,
      environmentTaskData,
      chatChannels,
    )

    // Set the rest of the data.
    this.server = server
    this.memberId = memberId
    this._state = state
    this._realmBasics = realmBasicData.map(
      (realm) => new SessionRealmBasic(realm),
    )

    this._activeExecutions = []
    this._unreadChatMessageCount = new Map(
      Object.entries(unreadChatChannelMessages),
    )
    this._initialPendingSessionPanelAlerts = pendingSessionPanelAlerts

    // Add listeners to detect events that are
    // emitted to the client.
    this.addListeners()
  }

  // Implemented
  protected parseRealmData(data: TSessionRealmJson[]): ClientSessionRealm[] {
    // The server sends only the realms visible to this member (their
    // subscribed realm, or none if unassigned).
    return data.map((realm) => ClientSessionRealm.fromJson(realm, this))
  }

  // Implemented
  protected parseMemberData(data: TSessionMemberJson[]): ClientSessionMember[] {
    return data.map(
      ({
        _id,
        user: userData,
        assignment,
        subscribedRealmId,
        joined,
        banned,
      }) => {
        return new ClientSessionMember(
          _id,
          ClientUser.fromExistingJson(userData),
          assignment,
          this,
          subscribedRealmId,
          joined,
          banned,
        )
      },
    )
  }

  // Implemented
  protected parseEnvironmentTaskData(
    data: TEnvironmentTaskJson[],
  ): ClientEnvironmentTask[] {
    return data.map((datum) => ClientEnvironmentTask.fromJson(datum, this))
  }

  // Implemented
  protected parseChatChannelData(
    data: TChatChannelJson[],
  ): ClientChatChannel[] {
    return data.map((datum) => ClientChatChannel.fromJson(datum, this))
  }

  /**
   * Creates session-specific listeners for the client's member.
   */
  private addListeners(): void {
    this.listenerInputRegistry.forEach(([method, handler]) => {
      this.server.addEventListener(method, (event: any) =>
        handler(this.member, event),
      )
    })
  }

  /**
   * Removes session-specific listeners for the client's member.
   */
  private removeListeners(): void {
    this.server.clearEventListeners(
      this.listenerInputRegistry.map(([method]) => method),
    )
  }

  // Implemented
  public toJson(): TSessionJson {
    return {
      _id: this._id,
      state: this.state,
      name: this.name,
      ownerId: this.ownerId,
      ownerUsername: this.ownerUsername,
      ownerFirstName: this.ownerFirstName,
      ownerLastName: this.ownerLastName,
      launchedAt: this.launchedAt.toISOString(),
      mission: this.mission.toExistingJson({
        forceExposure: { expose: 'none' },
        fileExposure: { expose: 'none' },
        sessionDataExposure: {
          expose: 'member-specific',
          memberId: this.member._id,
        },
        rootEffectsExposure: { expose: 'none' },
      }),
      realms: this._realms.map((realm) => realm.toJson()),
      realmBasics: this._realmBasics.map((realm) => realm.toJson()),
      members: this.members.map((member) => member.toJson()),
      environmentTasks: this.environmentTasks.map((task) => task.toJson()),
      config: this.config,
      chatChannels: this._chatChannels.map((chat) => chat.toJson()),
      unreadChatChannelMessages: {},
      pendingSessionPanelAlerts: [],
    }
  }

  // Implemented
  public toBasicJson(): TSessionBasicJson {
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
      participantIds: this.participants.map(({ _id: memberId }) => memberId),
      observerIds: this.observers.map(({ _id: memberId }) => memberId),
      managerIds: this.managers.map(({ _id: memberId }) => memberId),
      joinedMemberCount: this.joinedMembers.length,
      setupFailed: this.setupFailed,
      teardownFailed: this.teardownFailed,
    }
  }

  /**
   * Opens a node.
   * @param nodeId The ID of the node to be opened.
   */
  public openNode(nodeId: string, options: TSessionRequestOptions = {}): void {
    // Gather details.
    let server: ServerConnection = this.server
    let node: ClientMissionNode | undefined =
      this.subscribedMission.getNodeById(nodeId)

    // Callback for errors.
    const onError = (message: string) => {
      console.error(message)
      if (options.onError) options.onError(message)
    }

    // If the member is not authorized to open nodes,
    // callback an error.
    if (!this.member.isAuthorized('manipulateNodes')) {
      return onError('You do not have the correct permissions to open nodes.')
    }
    // Callback error if the node is not in
    // the mission associated with this
    // session.
    if (node === undefined) {
      return onError('Node was not found in the mission.')
    }
    // If the node is not openable, callback
    // an error.
    if (!node.openable) {
      return onError('Node is not openable.')
    }

    // Emit a request to open the node.
    server.request(
      'request-open-node',
      {
        nodeId,
      },
      `Opening "${node.name}".`,
      {
        // Handle error emitted by server concerning the
        // request.
        onResponse: (event) => {
          if (event.method === 'node-opened') {
            this.subscribedMission.emitEvent('autopan')
          }

          if (event.method === 'error') {
            onError(event.message)
            node!.handleRequestFailed('request-open-node')
          }
        },
      },
    )

    // Handle request within node.
    node.handleRequestMade('request-open-node')
  }

  /**
   * Executes an action.
   * @param actionId The ID of the action to be executed.
   */
  public executeAction(
    actionId: string,
    options: TExecuteActionOptions = {},
  ): void {
    let server: ServerConnection = this.server
    let action: ClientMissionAction | undefined =
      this.subscribedRealm.getAction(actionId)
    const { cheats } = options

    // Callback for errors.
    const onError = (message: string) => {
      console.error(message)
      if (options.onError) options.onError(message)
    }

    // If the member is not authorized to execute actions,
    // callback an error.
    if (!this.member.isAuthorized('manipulateNodes')) {
      return onError(
        'You do not have the correct permissions to execute actions.',
      )
    }
    // Callback error if the action is not in
    // the mission associated with this
    // session.
    if (action === undefined) {
      return onError('Action was not found in the mission.')
    }
    // If the action is not executable, callback
    // an error.
    if (!action.node.executable) {
      return onError('Node is not executable.')
    }
    // If the action is not ready to execute, callback
    // with the reasons why.
    let unreadyReasons = this.unreadyToExecuteReasons(action, cheats)
    if (unreadyReasons.length) {
      return onError(
        `Action cannot be executed due to the following reasons:\n` +
          unreadyReasons.map((reason) => `*- ${reason}*`).join('\n'),
      )
    }

    // Emit a request to execute the action.
    server.request(
      'request-execute-action',
      {
        actionId,
        cheats,
      },
      `Executing "${action.name}" on "${action.node.name}".`,
      {
        onResponse: (event) => {
          // Handle error emitted by server concerning the
          // request.
          if (event.method === 'error') {
            onError(event.message)
            action!.node.handleRequestFailed('request-execute-action')
          }
        },
      },
    )

    // Handle request within node.
    action.node.handleRequestMade('request-execute-action')
  }

  /**
   * Sends the node's pre-execution message to the output panel.
   * @param nodeId The ID of the node with the pre-execution message.
   * @param options The options for sending the pre-execution message.
   */
  public sendPreExecutionMessage(
    nodeId: ClientMissionNode['_id'],
    options: TSessionRequestOptions = {},
  ) {
    // Gather details.
    let server: ServerConnection = this.server
    let node: ClientMissionNode | undefined =
      this.subscribedMission.getNodeById(nodeId)
    let { onError = () => {} } = options

    // If the node doesn't have a pre-execution message,
    // or is currently executing, don't send the message.
    if (!node?.preExecutionText || node.executing) return

    // If the member does not have the correct permissions,
    // callback an error.
    if (!this.member.isAuthorized('manipulateNodes')) {
      return onError('You are not authorized to send pre-execution messages.')
    }

    // Callback error if the node is not in
    // the mission associated with this
    // session.
    if (node === undefined) {
      return onError('Node was not found in the mission.')
    }

    // Emit a request to send the pre-execution message.
    server.request(
      'request-send-output',
      {
        key: 'pre-execution',
        nodeId,
      },
      `Sending pre-execution message for "${node.name}".`,
      {
        // Handle error emitted by server concerning the
        // request.
        onResponse: (event) => {
          if (event.method === 'error') {
            onError(event.message)
            node?.handleRequestFailed('request-send-output')
          }
        },
      },
    )

    // Handle request within node.
    node.handleRequestMade('request-send-output')
  }

  /**
   * Periodically emits events on the mission for active
   * executions for as long as there is time remaining for
   * any active execution.
   */
  protected tickActiveExecutions = (): void => {
    // If there is already an active timeout, return.
    if (this.activeExecutionTimeout !== null) return

    // Internal recursive algorithm to isolate
    // firstCall parameter.
    const algorithm = (firstCall: boolean = true) => {
      // Emit a 'tick' event.
      if (!firstCall) this.subscribedMission.emitEvent('execution-tick')

      // Set a timeout to call recursively until
      // the time runs out on all active executions.
      this.activeExecutionTimeout = setTimeout(() => {
        // If there is time remaining on any active execution,
        // call the algorithm again.
        if (
          this.activeExecutions.some(({ timeRemaining }) => timeRemaining > 0)
        ) {
          algorithm(false)
        } else {
          // Else, clear the timeout cache.
          this.activeExecutionTimeout = null
          // Emit a final tick event, assuming
          // this isn't the first call.
          if (!firstCall) {
            this.subscribedMission.emitEvent('execution-tick')
          }
        }
      }, 50) as any as number | null // Type casting for browser compatibility.
    }

    algorithm()
  }

  /**
   * Request to quit the session.
   * @returns A promise that resolves when the session is quitted.
   */
  public async $quit(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.server.request('request-quit-session', {}, 'Quitting session.', {
        onResponse: (event) => {
          switch (event.method) {
            case 'session-quit':
              resolve()
              break
            case 'error':
              reject(new Error(event.message))
              break
            default:
              let error: Error = new Error(
                `Unknown response method for ${event.request.event.method}: '${event.method}'.`,
              )
              console.log(error)
              console.log(event)
              reject(error)
          }
        },
      })
    })
  }

  /**
   * Starts the session.
   * @resolves When the session has started.
   * @rejects If the session failed to start, or if the session has already
   * started or ended.
   */
  public async $start(options: TSessionLifecycleOptions = {}): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const { onInit = () => {} } = options

      // Callback for errors.
      const onError = (message: string) => {
        let error: Error = new Error(message)
        console.error(message)
        console.error(error)
        reject(error)
      }

      // If the session has already started, throw an error.
      if (this.state === 'started') {
        return onError('Session has already started.')
      }
      // If the session has already ended, throw an error.
      if (this.state === 'ended') {
        return onError('Session has already ended.')
      }

      // Emit a request to start the session.
      this.server.request('request-start-session', {}, 'Starting session.', {
        onResponse: (event) => {
          switch (event.method) {
            case 'session-starting':
              this._state = 'starting'
              onInit()
              break
            case 'session-started':
              this._state = 'started'
              return resolve()
            case 'error':
              return onError(event.message)
            default:
              return onError(
                `Unknown response method for ${event.request.event.method}: '${event.method}'.`,
              )
          }
        },
      })
    })
  }

  /**
   * Ends the session.
   * @resolves When the session has ended.
   * @rejects If the session failed to end, or if the session has already
   * ended or has not yet started.
   */
  public async $end(options: TSessionLifecycleOptions = {}): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const { onInit = () => {} } = options

      // Callback for errors.
      const onError = (message: string) => {
        let error: Error = new Error(message)
        console.error(message)
        console.error(error)
        reject(error)
      }

      // If the session is unstarted, throw an error.
      if (this.state === 'unstarted') {
        return onError('Session has not yet started.')
      }
      // If the session has already ended, throw an error.
      if (this.state === 'ended') {
        return onError('Session has already ended.')
      }

      // Emit a request to end the session.
      this.server.request('request-end-session', {}, 'Ending session.', {
        onResponse: (event) => {
          switch (event.method) {
            case 'session-ending':
              this._state = 'ending'
              onInit()
              break
            case 'session-ended':
              this._state = 'ended'
              return resolve()
            case 'error':
              return onError(event.message)
            default:
              return onError(
                `Unknown response method for ${event.request.event.method}: '${event.method}'.`,
              )
          }
        },
      })
    })
  }

  /**
   * Resets the session.
   * @resolves When the session has been reset.
   * @rejects If the session failed to reset, or if the session
   * has not yet started.
   */
  public async $reset(options: TSessionLifecycleOptions = {}): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const { onInit = () => {} } = options

      // Callback for errors.
      const onError = (message: string) => {
        let error: Error = new Error(message)
        console.error(message)
        console.error(error)
        reject(error)
      }

      // If the session has not started, throw an error.
      if (this.state === 'unstarted') {
        return onError('Session has not yet started.')
      }

      // Emit a request to reset the session.
      this.server.request('request-reset-session', {}, 'Resetting session.', {
        onResponse: (event) => {
          switch (event.method) {
            case 'session-resetting':
              this._state = 'resetting'
              onInit()
              break
            case 'session-reset':
              this._state = 'started'
              return resolve()
            case 'error':
              return onError(event.message)
            default:
              return onError(
                `Unknown response method for ${event.request.event.method}: '${event.method}'.`,
              )
          }
        },
      })
    })
  }

  /**
   * Updates the session config.
   * @param configUpdates The updates to the session config.
   * @resolves When the session config has been updated.
   * @rejects If the session failed to update config, or if the session has already
   * started or ended.
   */
  public async $updateConfig(
    configUpdates: Partial<TSessionConfig>,
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // Callback for errors.
      const onError = (message: string) => {
        let error: Error = new Error(message)
        console.error(message)
        console.error(error)
        reject(error)
      }

      // If the session has already started, throw an error.
      if (this.state === 'started') {
        return onError('Session has already started.')
      }
      // If the session has already ended, throw an error.
      if (this.state === 'ended') {
        return onError('Session has already ended.')
      }

      // Emit a request to end the session.
      this.server.request(
        'request-config-update',
        { config: configUpdates },
        'Updating config.',
        {
          onResponse: (event) => {
            switch (event.method) {
              case 'session-config-updated':
                // Update the session config.
                Object.assign(this._config, configUpdates)
                // Update the session name if it has changed.
                if (this.name !== configUpdates.name && configUpdates.name) {
                  this.name = configUpdates.name
                }
                return resolve()
              case 'error':
                return onError(event.message)
              default:
                return onError(
                  `Unknown response method for ${event.request.event.method}: '${event.method}'.`,
                )
            }
          },
        },
      )
    })
  }

  /**
   * Kicks a member from the session.
   * @param memberId The ID of the member to be kicked.
   * @resolves When the member has been kicked.
   * @rejects If the member failed to be kicked.
   */
  public async $kick(memberId: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // Callback for errors.
      const onError = (message: string) => {
        let error: Error = new Error(message)
        console.error(message)
        console.error(error)
        reject(error)
      }

      // Get the member.
      let member = this.getMember(memberId)

      // If the member is not found,
      // callback an error.
      if (member === undefined) {
        return onError('Member not found.')
      }

      // Emit a request to kick the user.
      this.server.request(
        'request-kick',
        { memberId },
        `Kicking "${member.user.username}".`,
        {
          onResponse: (event) => {
            switch (event.method) {
              case 'kicked':
                return resolve()
              case 'error':
                return onError(event.message)
              default:
                return onError(
                  `Unknown response method for ${event.request.event.method}: '${event.method}'.`,
                )
            }
          },
        },
      )
    })
  }

  /**
   * Bans a member from the session.
   * @param memberId The ID of the member to be banned.
   * @resolves When the member has been banned.
   * @rejects If the member failed to be banned.
   */
  public async $ban(memberId: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // Callback for errors.
      const onError = (message: string) => {
        let error: Error = new Error(message)
        console.error(message)
        console.error(error)
        reject(error)
      }

      // Get the member.
      let member = this.getMember(memberId)

      // If the member is not found,
      // callback an error.
      if (member === undefined) {
        return onError('Member not found.')
      }

      // Emit a request to ban the user.
      this.server.request(
        'request-ban',
        { memberId },
        `Banning "${member.user.username}".`,
        {
          onResponse: (event) => {
            switch (event.method) {
              case 'banned':
                return resolve()
              case 'error':
                return onError(event.message)
              default:
                return onError(
                  `Unknown response method for ${event.request.event.method}: '${event.method}'.`,
                )
            }
          },
        },
      )
    })
  }

  /**
   * Lifts a member's ban from the session, allowing them to rejoin.
   * @param memberId The ID of the member whose ban to lift.
   * @resolves When the member's ban has been lifted.
   * @rejects If the member failed to be unbanned.
   */
  public async $unban(memberId: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // Callback for errors.
      const onError = (message: string) => {
        let error: Error = new Error(message)
        console.error(message)
        console.error(error)
        reject(error)
      }

      // Get the member.
      let member = this.getMember(memberId)

      // If the member is not found,
      // callback an error.
      if (member === undefined) {
        return onError('Member not found.')
      }

      // Emit a request to unban the user.
      this.server.request(
        'request-unban',
        { memberId },
        `Lifting ban for "${member.user.username}".`,
        {
          onResponse: (event) => {
            switch (event.method) {
              case 'unbanned':
                return resolve()
              case 'error':
                return onError(event.message)
              default:
                return onError(
                  `Unknown response method for ${event.request.event.method}: '${event.method}'.`,
                )
            }
          },
        },
      )
    })
  }

  /**
   * Assigns a force to a member.
   * @param memberId The ID of the member to be assigned.
   * @param forceId The ID of the force to be assigned, `null` if unassigning.
   * @resolves When the force has been assigned.
   * @rejects If the force failed to be assigned.
   */
  public async $assignForce(
    memberId: string,
    forceId: string | null,
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // Callback for errors.
      const onError = (message: string) => {
        let error: Error = new Error(message)
        console.error(message)
        console.error(error)
        reject(error)
      }

      // Get the member.
      let member = this.getMember(memberId)

      // If the member is not found,
      // callback an error.
      if (member === undefined) {
        return onError('Member not found.')
      }

      // Emit a request to assign the force.
      this.server.request(
        'request-assign-force',
        { memberId, forceId },
        `Assigning force to "${member.user.username}".`,
        {
          onResponse: (event) => {
            switch (event.method) {
              case 'force-assigned':
                return resolve()
              case 'error':
                return onError(event.message)
              default:
                return onError(
                  `Unknown response method for ${event.request.event.method}: '${event.method}'.`,
                )
            }
          },
        },
      )
    })
  }

  /**
   * Assigns a role to a member.
   * @param memberId The ID of the member to be assigned.
   * @param roleId The ID of the role to be assigned.
   * @resolves When the role has been assigned.
   * @rejects If the role failed to be assigned.
   */
  public $assignRole(memberId: string, roleId: TMemberRoleId): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // Callback for errors.
      const onError = (message: string) => {
        let error: Error = new Error(message)
        console.error(message)
        console.error(error)
        reject(error)
      }

      // Get the member.
      let member = this.getMember(memberId)

      // If the member is not found,
      // callback an error.
      if (member === undefined) {
        return onError('Member not found.')
      }

      // Emit a request to assign the role.
      this.server.request(
        'request-assign-role',
        { memberId, roleId },
        `Assigning role to "${member.user.username}".`,
        {
          onResponse: (event) => {
            switch (event.method) {
              case 'role-assigned':
                return resolve()
              case 'error':
                return onError(event.message)
              default:
                return onError(
                  `Unknown response method for ${event.request.event.method}: '${event.method}'.`,
                )
            }
          },
        },
      )
    })
  }

  /**
   * Sends a request to the server to mark a node alert
   * as acknowledged.
   * @param alertId The ID of the alert.
   * @param nodeId The ID of the node to which the alert belongs.
   * @resolves When the alert has been acknowledged.
   * @rejects If the alert failed to be acknowledged.
   */
  public $acknowledgeNodeAlert(alertId: string, nodeId: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // Callback for errors.
      const onError = (message: string) => {
        let error: Error = new Error(message)
        console.error(message)
        console.error(error)
        reject(error)
      }

      // Emit a request to acknowledge the node alert.
      this.server.request(
        'request-acknowledge-node-alert',
        { alertId, nodeId },
        `Acknowledging node alert "${alertId}" on node "${nodeId}".`,
        {
          onResponse: (event) => {
            switch (event.method) {
              case 'node-alert-acknowledged':
                return resolve()
              case 'error':
                return onError(event.message)
              default:
                return onError(
                  `Unknown response method for ${event.request.event.method}: '${event.method}'.`,
                )
            }
          },
        },
      )
    })
  }

  /**
   * Imports data provided to a member when the session
   * is started or reset.
   * @param event The event emitted by the server.
   */
  protected importStartData(
    event: TResponseEvents['session-started' | 'session-reset'],
  ): void {
    let { subscribedRealm: realmData, chatChannels } = event.data
    let realm = ClientSessionRealm.fromJson(realmData, this)

    // Reset session state.
    this._state = 'started'
    this._realms = []
    this._chatChannels = this.parseChatChannelData(chatChannels)
    this._unreadChatMessageCount = new Map()

    // Add new realm and subscribe the member to it.
    this._realms.push(realm)
  }

  /**
   * Added context for {@link readyToExecute}, this returns the
   * reasons why an action is not ready to be executed in the session, given the cheats.
   * @param action The action in question.
   * @param cheats The cheats which may change the action's readiness.
   * @returns The reasons why the action is not ready to execute.
   */
  public unreadyToExecuteReasons(
    action: ClientMissionAction,
    cheats: Partial<TExecutionCheats> = {},
  ): string[] {
    let reasons: string[] = []
    let nodeReady = action.node.readyToExecute
    let unmetCosts = this.getUnmetCosts(action, cheats)
    let unmetCostNames = unmetCosts.map((cost) => cost.name.toLowerCase())
    let unmetCostAmounts = unmetCosts.map((cost) =>
      ClientActionCost.formatAmount(cost.amount, {
        amountHidden: cost.hidden,
        includeMinusSign: false,
      }),
    )
    let executionLimitReached = action.executionLimitReached

    // Handle case when there are not enough resources.
    // Build a message which specifies which resources
    // are missing to execute the action.
    if (unmetCosts.length === 1) {
      reasons.push(
        `Not enough ${unmetCostNames[0]} (costs ${unmetCostAmounts[0]}) to execute.`,
      )
    } else if (unmetCosts.length === 2) {
      reasons.push(
        `Not enough ${unmetCostNames[0]} (costs ${unmetCostAmounts[0]}) or ${unmetCostNames[1]} (costs ${unmetCostAmounts[1]}) to execute.`,
      )
    } else if (unmetCosts.length > 2) {
      let lastResourceName = unmetCostNames[unmetCostNames.length - 1]
      let lastResourceAmount = unmetCostAmounts[unmetCostAmounts.length - 1]
      let otherResourcesMessages = unmetCostNames
        .slice(0, unmetCostNames.length - 1)
        .map((name, index) => `${name} (costs ${unmetCostAmounts[index]})`)
        .join(', ')
      reasons.push(
        `Not enough ${otherResourcesMessages}, or ${lastResourceName} (costs ${lastResourceAmount}) to execute.`,
      )
    }
    if (!nodeReady) {
      reasons.push('Node is not ready to execute.')
    }
    if (executionLimitReached) {
      reasons.push('Execution limit for this action has been reached.')
    }

    return reasons
  }

  /**
   * Handles clean-up when a session is quitted, ended,
   * or destroyed.
   */
  protected cleanUp(): void {
    this.removeListeners()
    this.server.clearUnfulfilledRequests()
  }

  /**
   * Sends a chat message to a channel.
   * @param channelId The ID of the channel to send the message to.
   * @param message The HTML message content.
   */
  public sendChatMessage(channelId: string, message: string): void {
    this.server.request(
      'request-send-chat-message',
      { channelId, message },
      'Sending chat message.',
    )
  }

  /**
   * Returns the unread message count for a chat channel.
   * @param channelId The ID of the chat channel.
   */
  public getUnreadChatMessageCount(channelId: string): number {
    return this._unreadChatMessageCount.get(channelId) ?? 0
  }

  /**
   * Marks all messages in a chat channel as read and notifies the server
   * via {@link acknowledgeSessionPanelAlert}.
   * @param channelId The ID of the chat channel.
   */
  public markAllMessagesInChannelAsRead(channelId: string): void {
    this._unreadChatMessageCount.set(channelId, 0)
    this.acknowledgeSessionPanelAlert('Messenger', channelId)
  }

  /**
   * Acknowledges a session panel alert, notifying the server that the
   * member has viewed the indicated panel.
   * @param panel The panel tab that was viewed.
   * @param channelId The chat channel that was viewed (Messenger only).
   * @note For the Messenger panel, the channel ID is required so the
   * server can also clear that channel's unread count.
   */
  public acknowledgeSessionPanelAlert(panel: 'Output' | 'Files'): void
  public acknowledgeSessionPanelAlert(
    panel: 'Messenger',
    channelId: string,
  ): void
  public acknowledgeSessionPanelAlert(
    panel: TSessionPanelAlert,
    channelId?: string,
  ): void {
    if (panel === 'Messenger' && channelId !== undefined) {
      this.server.emit('acknowledge-session-panel-alert', { panel, channelId })
    } else {
      this.server.emit('acknowledge-session-panel-alert', {
        panel: panel as 'Output' | 'Files',
      })
    }
  }

  /**
   * Fetches the current session panel alerts for a member.
   */
  public fetchSessionPanelAlerts(): void {
    this.server.emit('fetch-session-panel-alerts', {})
  }

  /**
   * Logs a target-environment task (hook or effect) to the console at
   * the session level, so managers can monitor and diagnose it as it
   * occurs.
   * @param task The task to log.
   * @note Unresolved tasks (queued, running) are not logged; only
   * resolved states (success, failure, skipped) are.
   */
  protected logTask(task: ClientEnvironmentTask): void {
    let context = 'TE'
    let { source, status, environment, error } = task

    // Only resolved tasks are worth logging.
    if (status === 'queued' || status === 'running') return

    let errorMessage =
      error?.message || error?.code || error?.name || 'Unknown error'

    switch (source.kind) {
      case 'hook': {
        let label = source.method === 'environment-setup' ? 'setup' : 'teardown'
        let properties = [environment.name, source.method]
        let message = undefined

        if (status === 'success') {
          message = `${environment.name} ${label} hook succeeded.`
          Logging.info(message, { context, properties })
        } else if (status === 'skipped') {
          message = `${environment.name} ${label} hook was skipped (a prior hook in this environment failed).`
          Logging.warning(message, { context, properties })
        } else {
          message = `${environment.name} ${label} hook failed: ${errorMessage}`
          Logging.error(message, { context, properties })
        }
        break
      }
      case 'effect': {
        let properties = [environment.name, source.trigger]
        let message = undefined

        if (status === 'success') {
          message = `Effect "${source.effectName}" on "${source.targetName}" succeeded.`
          Logging.info(message, { context, properties })
        } else if (status === 'skipped') {
          message = `Effect "${source.effectName}" on "${source.targetName}" was skipped (has unresolved issues).`
          Logging.warning(message, { context, properties })
        } else {
          message = `Effect "${source.effectName}" on "${source.targetName}" failed: ${errorMessage}`
          Logging.error(message, { context, properties })
        }
        break
      }
      default: {
        let properties = [environment.name, status]
        let message = undefined

        if (status === 'failure') {
          message = `Task failed: ${errorMessage}`
          Logging.error(message, { context, properties })
        } else if (status === 'skipped') {
          message = `Task was skipped.`
          Logging.warning(message, { context, properties })
        } else {
          message = `Task ${status}.`
          Logging.info(message, { context, properties })
        }
        break
      }
    }
  }

  /**
   * Handles node open/close state change events from the server.
   * @param data The event data containing the node ID, new state, and revealed descendants.
   * @note This coordinates updates at both the prototype (template) and node (instance) levels.
   * @note If the node hasn't been revealed to this member yet, the event is ignored with a warning.
   */
  protected onChangeNodeOpenState = (
    nodes: TInstanceOrArray<Omit<TNodeOpenStateData, 'opened'>>,
    opened: boolean,
  ): void => {
    let hasRevealedDescendants = false

    for (let data of ArrayToolbox.toArray(nodes)) {
      // Extract the event data.
      let { structure, revealedDescendants, revealedDescendantPrototypes } =
        data

      // Find the target node in the mission using lookup data.
      let node = this.subscribedMission.lookUpNode(data)
      if (!node) {
        console.warn(
          `Node "${data._id}" was not found. This is likely due to an effect being applied to a node that has not yet been revealed to the user.`,
        )
        continue
      }
      let { prototype } = node

      // Update both the prototype (template level) and node (instance level).
      if (opened) {
        // Opening: Reveal descendants and establish structure relationships.
        prototype.onOpen(revealedDescendantPrototypes, structure)
        node.onOpen(revealedDescendants)
      } else {
        // Closing: Hide descendants (unless member has complete visibility).
        prototype.onClose(this.member)
        node.onClose(this.member)
      }

      if (revealedDescendants) hasRevealedDescendants = true
    }

    // Rebuild the action map once if any node revealed new descendants.
    if (hasRevealedDescendants) this.subscribedRealm.mapActions()
  }

  /**
   * Fetches all sessions publicly available.
   * @resolves To the sessions.
   * @rejects If the sessions failed to be fetched.
   */
  public static $fetchAll(): Promise<SessionBasic[]> {
    return new Promise<SessionBasic[]>(
      async (
        resolve: (sessions: SessionBasic[]) => void,
        reject: (error: any) => void,
      ): Promise<void> => {
        try {
          // Call API to fetch all sessions.
          let sessionData: TSessionBasicJson[] = (
            await axios.get<TSessionBasicJson[]>(MissionSession.API_ENDPOINT, {
              params: { timeStamp: Date.now().toString() },
            })
          ).data
          return resolve(sessionData.map((datum) => new SessionBasic(datum)))
        } catch (error) {
          console.error('Failed to fetch sessions.')
          console.error(error)
          return reject(error)
        }
      },
    )
  }

  /**
   * Launches a new session with a new session ID.
   * @param missionId  The ID of the mission being executed in the session.
   * @resolves To the session ID.
   * @rejects If the session failed to launch.
   */
  public static async $launch(
    missionId: string,
    sessionConfig: Partial<TSessionConfig>,
  ): Promise<string> {
    try {
      // Call API to launch new session with
      // the mission ID. Await the generated
      // session ID.
      let { sessionId } = (
        await axios.post<{ sessionId: string }>(
          `${MissionSession.API_ENDPOINT}/launch/`,
          {
            missionId,
            ...sessionConfig,
          },
        )
      ).data
      return sessionId
    } catch (error) {
      console.error('Failed to launch session.')
      console.error(error)
      throw error
    }
  }

  /**
   * Deletes a session with the given ID.
   * @param _id The ID of the session to be deleted.
   * @resolves When the session has been deleted.
   * @rejects If the session failed to be deleted.
   */
  public static $delete(_id: string): Promise<void> {
    return new Promise<void>(
      async (
        resolve: () => void,
        reject: (error: any) => void,
      ): Promise<void> => {
        try {
          // Call API to delete session.
          await axios.delete(`${MissionSession.API_ENDPOINT}/${_id}`)
          return resolve()
        } catch (error) {
          console.error('Failed to delete session.')
          console.error(error)
          return reject(error)
        }
      },
    )
  }
}

/* -- TYPES -- */

/**
 * Options for methods that make requests to
 * the server via WS.
 */
type TSessionRequestOptions = {
  /**
   * Callback for errors.
   * @param message The error message.
   */
  onError?: (message: string) => void
}

/**
 * Options to pass to {@link SessionClient.$start},
 * {@link SessionClient.$end} and {@link SessionClient.$reset}
 * methods.
 */
type TSessionLifecycleOptions = {
  /**
   * Callback for when the server acknowledges
   * the request to start/end the session and has
   * marked the session as 'starting'/'ending'.
   */
  onInit?: () => void
}

/**
 * Options for `executeAction` method.
 */
interface TExecuteActionOptions extends TSessionRequestOptions {
  /**
   * The cheats to be applied when executing the action.
   * @note If the member is not authorized to use cheats, this
   * will be ignored.
   * @note Any ommitted cheats will be considered `false`.
   */
  cheats?: Partial<TExecutionCheats>
}
