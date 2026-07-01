import type {
  ServerConnection,
  TServerHandler,
} from '@client/connect/ServerConnection'
import { ClientActionCost } from '@client/missions/actions/ClientActionCost'
import { ClientActionExecution } from '@client/missions/actions/ClientActionExecution'
import { ClientExecutionOutcome } from '@client/missions/actions/ClientExecutionOutcome'
import type { ClientMissionAction } from '@client/missions/actions/ClientMissionAction'
import { ClientMission } from '@client/missions/ClientMission'
import { ClientMissionFile } from '@client/missions/files/ClientMissionFile'
import { ClientOutput } from '@client/missions/forces/ClientOutput'
import type { ClientMissionNode } from '@client/missions/nodes/ClientMissionNode'
import { ClientSessionRealm } from '@client/sessions/ClientSessionRealm'
import { ClientTargetEnvironment } from '@client/target-environments/ClientTargetEnvironment'
import { Logging } from '@client/toolbox/Logging'
import { ClientUser } from '@client/users/ClientUser'
import type {
  TGenericServerEvents,
  TNodeOpenStateData,
  TResponseEvents,
  TServerEvents,
  TServerMethod,
  TSessionPanelAlert,
} from '@shared/connect'
import type {
  TActionExecutionJson,
  TExecutionCheats,
} from '@shared/missions/actions/ActionExecution'
import type { TExecutionOutcomeJson } from '@shared/missions/actions/ExecutionOutcome'
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
import { EnvScriptResults } from '@shared/target-environments/EnvScriptResults'
import type { TInstanceOrArray } from '@shared/toolbox/arrays/ArrayToolbox'
import { ArrayToolbox } from '@shared/toolbox/arrays/ArrayToolbox'
import axios from 'axios'
import type { TMetisClientComponents } from '..'
import { ClientChatChannel } from './chat/ClientChatChannel'
import { ClientChatMessage } from './chat/ClientChatMessage'
import { ClientSessionMember } from './ClientSessionMember'
import { SessionBasic } from './SessionBasic'

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
  private _unreadChatMessageCount: Map<string, number>

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
  private _activeExecutions: ClientActionExecution[]

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
      members: memberData,
      config,
      setupResults: setupResultData,
      teardownResults: teardownResultData,
      liveResults: liveResultData,
      chatChannels,
      unreadChatChannelMessages,
      pendingSessionPanelAlerts,
    } = data

    // Parse setup, teardown, and live results.
    let setupResults = setupResultData.map((datum) =>
      EnvScriptResults.fromJson(datum, ClientTargetEnvironment.REGISTRY),
    )
    let teardownResults = teardownResultData.map((datum) =>
      EnvScriptResults.fromJson(datum, ClientTargetEnvironment.REGISTRY),
    )
    let liveResults = liveResultData.map((datum) =>
      EnvScriptResults.fromJson(datum, ClientTargetEnvironment.REGISTRY),
    )

    // Call super constructor with base data.
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
      memberData,
      setupResults,
      teardownResults,
      liveResults,
      chatChannels,
    )

    // Set the rest of the data.
    this.server = server
    this.memberId = memberId
    this._state = state

    // Deserialize realms from the JSON. The server sends only the realms
    // visible to this member (subscribed realm, or empty if unassigned).
    this._realms = realmData.map((realm) =>
      ClientSessionRealm.fromJson(realm, this),
    )
    this._activeExecutions = []
    this._unreadChatMessageCount = new Map(
      Object.entries(unreadChatChannelMessages),
    )
    this._initialPendingSessionPanelAlerts = pendingSessionPanelAlerts

    this.listeners = [
      ['session-starting', this.onStarting],
      ['session-started', this.onStart],
      ['session-ending', this.onEnding],
      ['session-ended', this.onEnd],
      ['session-reset', this.onReset],
      ['session-config-updated', this.onConfigUpdate],
      ['session-members-updated', this.onMembersUpdate],
      ['session-setup-update', this.onSetupUpdate],
      ['session-teardown-update', this.onTeardownUpdate],
      ['session-live-update', this.onLiveUpdate],
      ['force-assigned', this.onForceAssigned],
      ['role-assigned', this.onRoleAssigned],
      ['node-opened', this.onNodeOpenedResponse],
      ['action-execution-initiated', this.onActionExecutionInitiated],
      ['action-execution-completed', this.onActionExecutionCompleted],
      ['node-open-state-updated', this.onNodeOpenStateUpdated],
      ['node-block-status-updated', this.onNodeBlockStatusUpdated],
      ['file-access-updated', this.onFileAccessUpdated],
      ['resource-pool-updated', this.onResourcePoolUpdated],
      ['send-output', this.onSendOutput],
      ['output-sent', this.onOutputSent],
      ['node-alert-acknowledged', this.onNodeAlertAcknowledged],
      ['node-alert-added', this.onNodeAlertAdded],
      ['action-process-time-updated', this.onActionModifierUpdated],
      ['action-success-chance-updated', this.onActionModifierUpdated],
      ['action-resource-cost-updated', this.onActionModifierUpdated],
      ['kicked', this.onKicked],
      ['banned', this.onBanned],
      ['dismissed', this.onDismissed],
      ['session-destroyed', this.onDestroyed],
      ['session-quit', this.onQuit],
      ['chat-message-received', this.onChatMessageReceived],
    ]

    // Add listeners to detect events that are
    // emitted to the client.
    this.addListeners()
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
  protected parseChatChannelData(
    data: TChatChannelJson[],
  ): ClientChatChannel[] {
    return data.map((datum) => ClientChatChannel.fromJson(datum, this))
  }

  /**
   * Cache for event listeners added by this SessionClient instance.
   */
  private listeners: [TServerMethod, TServerHandler<any>][]

  /**
   * Creates session-specific listeners.
   */
  private addListeners(): void {
    this.listeners.forEach(([event, handler]) => {
      this.server.addEventListener(event, handler)
    })
  }

  /**
   * Removes session-specific listeners.
   */
  private removeListeners(): void {
    this.listeners.forEach(([event, handler]) => {
      this.server.removeEventListener(event, handler)
    })
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
      members: this.members.map((member) => member.toJson()),
      setupResults: this.setupResults.map((result) => result.toJson()),
      teardownResults: this.teardownResults.map((result) => result.toJson()),
      liveResults: this.liveResults.map((result) => result.toJson()),
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
  private tickActiveExecutions = (): void => {
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
  private importStartData(
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
  private cleanUp(): void {
    this.removeListeners()
    this.server.clearUnfulfilledRequests()
  }

  /**
   * Handles when a chat message is received from the server.
   * @param event The event emitted by the server.
   */
  private onChatMessageReceived = (
    event: TServerEvents['chat-message-received'],
  ): void => {
    let msgData = event.data.message

    let channel = this.getChatChannel(msgData.channelId)
    if (!channel) return

    let message = ClientChatMessage.fromJson(channel, msgData)
    channel.messages.push(message)

    if (message.senderId !== this.memberId) {
      let count = this._unreadChatMessageCount.get(message.channelId) ?? 0
      this._unreadChatMessageCount.set(message.channelId, count + 1)
    }
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
   * Handles when the session is starting.
   * @param event The event emitted by the server.
   */
  private onStarting = (event: TResponseEvents['session-starting']): void => {
    this._state = 'starting'
  }

  /**
   * Handles when the session is started.
   * @param event The event emitted by the server.
   */
  private onStart = (event: TResponseEvents['session-started']): void => {
    this.importStartData(event)
  }

  /**
   * Handles when the session is ending.
   * @param event The event emitted by the server.
   */
  private onEnding = (event: TResponseEvents['session-ending']): void => {
    this._state = 'ending'
    this.cleanUp()
  }

  /**
   * Handles when the session is ended.
   * @param event The event emitted by the server.
   */
  private onEnd = (): void => {
    this._state = 'ended'
    this.cleanUp()
  }

  /**
   * Handles when the session is reset.
   * @param event The event emitted by the server.
   */
  private onReset = (event: TResponseEvents['session-reset']): void => {
    this.importStartData(event)
  }

  /**
   * Handles when the member is kicked from the session.
   */
  private onKicked = (event: TServerEvents['kicked']): void => {
    if (event.data.memberId === this.memberId) {
      this.cleanUp()
    }
  }

  /**
   * Handles when the member is banned from the session.
   */
  private onBanned = (event: TServerEvents['banned']): void => {
    if (event.data.memberId === this.memberId) {
      this.cleanUp()
    }
  }

  /**
   * Handles when the member is dismissed from the session.
   */
  private onDismissed = (event: TServerEvents['dismissed']): void => {
    this.cleanUp()
  }

  /**
   * Handles when the session is destroyed.
   */
  private onDestroyed = (event: TServerEvents['session-destroyed']): void => {
    this._state = 'ended'
    this.cleanUp()
  }

  /**
   * Handles when the member quits the session.
   */
  private onQuit = (event: TServerEvents['session-quit']): void => {
    this.cleanUp()
  }

  /**
   * Handles when the session configuration is updated.
   * @param event The event emitted by the server.
   */
  private onConfigUpdate = (
    event: TServerEvents['session-config-updated'],
  ): void => {
    this._config = event.data.config
  }

  /**
   * Handles when the lists of members joined in the session
   * changes, due to a join, quit, kick, or ban.
   * @param event The event emitted by the server.
   */
  private onMembersUpdate = (
    event: TGenericServerEvents['session-members-updated'],
  ): void => {
    let { members } = event.data
    this._members = members.map(
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

  /**
   * Handles when new results from the session setup
   * process are available.
   * @param event The event emitted by the server.
   */
  private onSetupUpdate = (
    event: TServerEvents['session-setup-update'],
  ): void => {
    let newResults = event.data.results.map((data) =>
      EnvScriptResults.fromJson(data, ClientTargetEnvironment.REGISTRY),
    )
    this.setupResults.push(...newResults)
    this.logScriptResults(newResults)
  }

  /**
   * Handles when new results from the session teardown
   * process are available.
   * @param event The event emitted by the server.
   */
  private onTeardownUpdate = (
    event: TServerEvents['session-teardown-update'],
  ): void => {
    let newResults = event.data.results.map((data) =>
      EnvScriptResults.fromJson(data, ClientTargetEnvironment.REGISTRY),
    )
    this.teardownResults.push(...newResults)
    this.logScriptResults(newResults)
  }

  /**
   * Handles when new target script results (effects) occur
   * live, while the session is in the `started` state.
   * @param event The event emitted by the server.
   */
  private onLiveUpdate = (
    event: TServerEvents['session-live-update'],
  ): void => {
    let newResults = event.data.results.map((data) =>
      EnvScriptResults.fromJson(data, ClientTargetEnvironment.REGISTRY),
    )
    this.liveResults.push(...newResults)
    this.logScriptResults(newResults)
  }

  /**
   * Logs target script results (hooks and effects) to the
   * console at the session level, so managers can monitor and diagnose
   * them as they occur.
   * @param results The newly realized results to log.
   */
  private logScriptResults(results: EnvScriptResults[]): void {
    let context = 'TE'

    for (let result of results) {
      let { source, status, environment, error } = result
      let errorMessage =
        error?.message || error?.code || error?.name || 'Unknown error'

      switch (source.kind) {
        case 'hook': {
          let label =
            source.method === 'environment-setup' ? 'setup' : 'teardown'
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

          continue
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

          continue
        }

        default: {
          let properties = [environment.name, status]
          let message = undefined

          if (status === 'failure') {
            message = `Target script failed: ${errorMessage}`
            Logging.error(message, { context, properties })
          } else if (status === 'skipped') {
            message = `Target script was skipped.`
            Logging.warning(message, { context, properties })
          } else {
            message = `Target script ${status}.`
            Logging.info(message, { context, properties })
          }

          continue
        }
      }
    }
  }

  /**
   * Handles when a force is assigned to a member.
   * @param event The event emitted by the server.
   */
  private onForceAssigned = (event: TServerEvents['force-assigned']): void => {
    let { memberId, forceId } = event.data
    let member = this.getMember(memberId)
    if (member === undefined) {
      return console.warn(
        `Event "force-assigned" was triggered, but the member with the given memberId ("${memberId}") could not be found.`,
      )
    }
    member.assignToForce(forceId)
  }

  /**
   * Handles when a role is assigned to a member.
   * @param event The event emitted by the server.
   */
  private onRoleAssigned = (event: TServerEvents['role-assigned']): void => {
    let { memberId, roleId } = event.data
    let member = this.getMember(memberId)
    if (member === undefined) {
      return console.warn(
        `Event "role-assigned" was triggered, but the member with the given memberId ("${memberId}") could not be found.`,
      )
    }
    member.assignToRole(roleId)
  }

  /**
   * Handles when the open state of one or more nodes is updated.
   * @param event The event emitted by the server.
   */
  private onNodeOpenStateUpdated = (
    event: TServerEvents['node-open-state-updated'],
  ): void => {
    let { nodes, opened } = event.data
    this.onChangeNodeOpenState(nodes, opened)
  }

  /**
   * Handles when an action modifier is applied to one or more actions.
   * @param event The event emitted by the server.
   */
  private onActionModifierUpdated = (
    event:
      | TServerEvents['action-process-time-updated']
      | TServerEvents['action-resource-cost-updated']
      | TServerEvents['action-success-chance-updated'],
  ): void => {
    let { lookUpData, modifier } = event.data

    for (let lookUpDatum of lookUpData) {
      let action = this.subscribedMission.lookUpAction(lookUpDatum)
      action?.onModify(modifier)
    }
  }

  /**
   * Handles the blocking and unblocking of nodes.
   * @param event The event emitted by the server.
   */
  private onNodeBlockStatusUpdated = (
    event: TServerEvents['node-block-status-updated'],
  ): void => {
    const { lookUpData, blocked } = event.data
    for (let lookUpDatum of lookUpData) {
      let node = this.subscribedMission.lookUpNode(lookUpDatum)
      if (node) node.blocked = blocked
    }
  }

  /**
   * Handles when a resource pool is modified.
   * @param event The event emitted by the server.
   */
  private onResourcePoolUpdated = (
    event: TServerEvents['resource-pool-updated'],
  ): void => {
    let { lookUpData, operand } = event.data
    for (let lookUpDatum of lookUpData) {
      let pool = this.subscribedMission.lookUpPool(lookUpDatum)
      pool?.onModify(operand)
    }
  }

  /**
   * Handles the granting/revoking of access to a file.
   * @param event The event emitted by the server.
   */
  private onFileAccessUpdated = (
    event: TServerEvents['file-access-updated'],
  ): void => {
    let { data } = event
    let files = data.files
      .map((fileJson) => {
        let file = this.subscribedMission.getFileById(fileJson._id)
        // Create a new file instance from the JSON,
        // only if access is being granted. Otherwise,
        // there is no need.
        if (!file && data.granted) {
          file = ClientMissionFile.fromJson(fileJson, this.subscribedMission)
          this.subscribedMission.files.push(file)
        }
        return file
      })
      .filter((file) => file !== undefined)

    // Update access per force.
    for (let forceId of data.forceIds) {
      let force = this.subscribedMission.getForceById(forceId)

      if (!force) {
        console.warn(
          `Event "file-access-updated" was triggered with granted=true, but the force with the given forceId ("${forceId}") could not be found.`,
        )
        continue
      }

      // If the following conditions are met, remove
      // the files from the mission entirely:
      // 1. Access is being revoked.
      // 2. The member is assigned to the force in question.
      // 3. The member does not have complete visibility, which
      //    would otherwise negate file-access restrictions.
      if (
        !data.granted &&
        this.member.assignedForceId === forceId &&
        !this.member.isAuthorized('completeVisibility')
      ) {
        let revokedIds = new Set(data.files.map((fileJson) => fileJson._id))
        this.subscribedMission.files = this.subscribedMission.files.filter(
          (file) => !revokedIds.has(file._id),
        )
      }

      force.updateFileAccess(files, data.granted)
    }
  }

  /**
   * Handles when an output has been sent.
   * @param event The event emitted by the server.
   */
  private onSendOutput = (event: TServerEvents['send-output']): void => {
    let { outputData } = event.data
    let { forceId } = outputData
    let force = this.subscribedMission.getForceById(forceId)
    if (force) {
      let output = new ClientOutput(force, outputData)
      force.storeOutput(output)
    }
  }

  /**
   * Handles when an output has been sent.
   * @param event The event emitted by the server.
   */
  private onOutputSent = (event: TServerEvents['output-sent']): void => {
    // Extract data.
    let { key } = event.data

    switch (key) {
      case 'pre-execution':
        let { nodeId } = event.data
        let node = this.subscribedMission.getNodeById(nodeId)
        node?.onOutput()
    }
  }

  /**
   * Handles when a node-opened response is received from the server.
   * @param event The event emitted by the server.
   */
  private onNodeOpenedResponse = (
    event: TServerEvents['node-opened'],
  ): void => {
    return this.onChangeNodeOpenState(event.data, event.data.opened)
  }

  /**
   * Handles when action execution has been initiated.
   * @param event The event emitted by the server.'
   */
  private onActionExecutionInitiated = (
    event: TServerEvents['action-execution-initiated'],
  ): void => {
    // Extract data.
    const { resourcePools } = event.data
    // Type is defined here below because for some reason
    // there are type issues when I extract it using
    // the destructuring syntax above.
    const executionData: TActionExecutionJson = event.data.execution
    const { actionId } = executionData

    // Find the action and node, given the action ID.
    let action: ClientMissionAction | undefined =
      this.subscribedRealm.getAction(actionId)
    let node: ClientMissionNode

    // Handle action not found.
    if (action === undefined) {
      return console.error(
        `Event "action-execution-initiated" was triggered, but the action with the given actionId ("${actionId}") could not be found.`,
      )
    }

    // Handle action found.
    node = action.node
    // Create a new execution object.
    let execution = new ClientActionExecution(
      executionData._id,
      action,
      executionData.start,
      executionData.end,
    )

    // Handle execution on the node.
    node.onExecution(execution)

    // Update the resource pools for the force.
    for (let updatedPool of resourcePools) {
      let pool = action.force.getPoolByResourceId(updatedPool.resourceId)
      if (pool && updatedPool.balance !== undefined) {
        pool.balance = updatedPool.balance
      }
    }
    action.force.emitEvent('modify-forces')

    // Add execution to active executions.
    this._activeExecutions.push(execution)
    this.tickActiveExecutions()
  }

  /**
   * Handles when action execution has been completed.
   * @param event The event emitted by the server.
   */
  private onActionExecutionCompleted = (
    event: TServerEvents['action-execution-completed'],
  ): void => {
    // Gather data.
    const { structure, revealedDescendants, revealedDescendantPrototypes } =
      event.data

    const outcomeData: TExecutionOutcomeJson = event.data.outcome
    const { executionId } = outcomeData
    const execution = this.subscribedMission.getExecution(executionId)
    if (!execution) {
      return console.error(`Execution "${executionId}" could not be found.`)
    }
    const { node } = execution
    const { prototype } = node

    const outcome = new ClientExecutionOutcome(
      outcomeData._id,
      outcomeData.state,
      execution,
    )

    // Handle outcome on different levels.
    execution.onOutcome(outcome)
    prototype.onOpen(revealedDescendantPrototypes, structure)
    node.onOpen(revealedDescendants)

    node.emitEvent('exec-state-change')

    // Remap actions if there are revealed nodes, since
    // those revealed nodes may contain new actions.
    if (revealedDescendants) this.subscribedRealm.mapActions()

    // Remove execution from active executions.
    this._activeExecutions = this._activeExecutions.filter(
      ({ _id }) => executionId !== _id,
    )
  }

  /**
   * Handles an event from the server indicating that a
   * node alert has been acknowledged.
   * @param data The event data containing the alert details.
   */
  private onNodeAlertAcknowledged = (
    event: TServerEvents['node-alert-acknowledged'],
  ): void => {
    const { nodeId, alertId } = event.data
    const node = this.subscribedMission.getNodeById(nodeId)
    if (!node) {
      return console.warn(`Node "${nodeId}" was not found.`)
    }
    node.onAlertAcknowledgement(alertId)
  }

  /**
   * Handles node open/close state change events from the server.
   * @param data The event data containing the node ID, new state, and revealed descendants.
   * @note This coordinates updates at both the prototype (template) and node (instance) levels.
   * @note If the node hasn't been revealed to this member yet, the event is ignored with a warning.
   */
  private onChangeNodeOpenState = (
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
   * Handles an event from the server indicating a new alert
   * was created for a node.
   * @param event The event emitted by the server.
   */
  private onNodeAlertAdded = (
    event: TServerEvents['node-alert-added'],
  ): void => {
    const { message, severityLevel, ids: alerts } = event.data
    for (const { nodeId, alertId } of alerts) {
      let node = this.subscribedMission.getNodeById(nodeId)
      if (!node) {
        console.warn(
          `Node "${nodeId}" was not found. This is likely due to an effect being applied to a node that has not yet been revealed to the user.`,
        )
        continue
      }
      node.onAlert({
        _id: alertId,
        nodeId,
        message,
        severityLevel,
        acknowledged: false,
      })
    }
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
