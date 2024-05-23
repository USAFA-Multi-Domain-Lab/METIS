import { TClientEvents, TServerEvents, TServerMethod } from 'metis/connect/data'
import { ServerEmittedError } from 'metis/connect/errors'
import ClientConnection from 'metis/server/connect/clients'
import ServerMission from 'metis/server/missions'
import ServerMissionAction from 'metis/server/missions/actions'
import ServerMissionNode from 'metis/server/missions/nodes'
import Session, {
  TSessionBasicJson,
  TSessionConfig,
  TSessionJson,
  TSessionRole,
  TSessionState,
} from 'metis/sessions'
import { v4 as generateHash } from 'uuid'
import ServerActionExecution from '../missions/actions/executions'

/**
 * Server instance for sessions. Handles server-side logic for a session with participating clients. Communicates with clients to conduct the session.
 */
export default class SessionServer extends Session<
  ClientConnection,
  ServerMission,
  ServerMissionNode,
  ServerMissionAction
> {
  // Overridden.
  public get state() {
    return this._state
  }
  // Overridden.
  public set state(value: TSessionState) {
    this._state = value
    this.handleStateChange()
  }

  /**
   * The resources available to the participants.
   */
  protected _resources: number

  // Implemented
  public get resources(): number {
    return this._resources
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

  public constructor(
    _id: string,
    name: string,
    config: Partial<TSessionConfig>,
    mission: ServerMission,
    participants: Array<ClientConnection>,
    supervisors: Array<ClientConnection>,
  ) {
    super(_id, name, config, mission, participants, [], supervisors)
    this._state = 'unstarted'
    this._resources = config.infiniteResources
      ? Infinity
      : mission.initialResources
    this._destroyed = false
    this.register()
  }

  // Implemented
  public isJoined(user: ClientConnection): boolean {
    for (let x of this.users) {
      if (x.userId === user.userId) {
        return true
      }
    }
    return false
  }

  // Implemented
  public isParticipant(user: ClientConnection): boolean {
    for (let x of this.users) {
      if (x.userId === user.userId) {
        return true
      }
    }
    return false
  }

  // Implemented
  public isSupervisor(user: ClientConnection): boolean {
    for (let x of this.supervisors) {
      if (x.userId === user.userId) {
        return true
      }
    }
    return false
  }

  // Implemented
  public toJson(options: TSessionServerJsonOptions = {}): TSessionJson {
    // Extract options.
    const { includeSensitiveData = false } = options

    // Construct and return JSON.
    return {
      _id: this._id,
      state: this.state,
      name: this.name,
      mission: this.mission.toJson({
        revealedOnly: true,
        includeSessionData: true,
      }),
      participants: this.participants.map((client: ClientConnection) =>
        client.user.toJson(),
      ),
      // Only include ban list if sensitive data
      // is marked to be included.
      banList: includeSensitiveData ? this.banList : [],
      supervisors: this.supervisors.map((client: ClientConnection) =>
        client.user.toJson(),
      ),
      config: this.config,
      resources: this.resources === Infinity ? 'infinite' : this.resources,
    }
  }

  // Implemented
  public toBasicJson(
    options: TSessionServerJsonOptions = {},
  ): TSessionBasicJson {
    // Extract options.
    const { includeSensitiveData = false } = options

    // Construct and return JSON.
    return {
      _id: this._id,
      missionId: this.missionId,
      name: this.name,
      config: this.config,
      participantIds: this.participants.map(({ userId: userId }) => userId),
      banList: includeSensitiveData ? this.banList : [],
      supervisorIds: this.supervisors.map(({ userId: userId }) => userId),
    }
  }

  /**
   * Gets the role of the given user in the session.
   */
  public getRole(user: ClientConnection): TSessionRole {
    if (this.isSupervisor(user)) {
      return 'supervisor'
    } else if (this.isParticipant(user)) {
      return 'participant'
    } else {
      return 'not-joined'
    }
  }

  // Implemented
  protected mapActions(): void {
    // Initialize the actions map.
    this.actions = new Map<string, ServerMissionAction>()

    // Loops through and maps each action.
    this.mission.nodes.forEach((node) => {
      node.actions.forEach((action) => {
        this.actions.set(action._id, action)
      })
    })
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
   * Destroys the session.
   */
  public destroy(): void {
    // Unregister session.
    this.unregister()
    // Mark as destroyed.
    this._destroyed = true

    // Grab all users.
    let users: ClientConnection[] = this.users

    // Clear all users.
    this.clearUsers()

    // Emit an event to all users that the session has been destroyed.
    for (let user of users) {
      user.emit('session-destroyed', { data: { sessionId: this._id } })
    }
  }

  /**
   * Has the given user join the session.
   * @param client The user joining the session.
   * @param method The method of joining (Whether as a participant or as a supervisor).
   * @throws The server emitted error code of any error that occurs.
   * @note Establishes listeners to handle events emitted by the user's web socket connection.
   */
  public join(client: ClientConnection, method: TSessionRole): void {
    // Throw error if the user is in the ban list.
    if (this._banList.includes(client.userId)) {
      throw ServerEmittedError.CODE_SESSION_BANNED
    }
    // Throw error if the user is already in the session.
    if (this.isJoined(client)) {
      throw ServerEmittedError.CODE_ALREADY_IN_SESSION
    }
    // Add the user to the session given
    // the method of joining.
    switch (method) {
      case 'participant':
        // Add the users to the participant list.
        this._participants.push(client)
        // Add session-specific listeners.
        this.addListeners(client)
        break
      case 'supervisor':
        // Throw error if the client is unauthorized to
        // join as a supervisor.
        if (!client.user.isAuthorized('sessions_join_observer')) {
          throw ServerEmittedError.CODE_SESSION_UNAUTHORIZED_JOIN
        }
        // Add the users to the supervisor list.
        this._supervisors.push(client)
        break
      default:
        throw ServerEmittedError.CODE_SESSION_UNAUTHORIZED_JOIN
    }

    // Handle joining the session for the client.
    client.login.handleJoin(this._id)

    // Handle state change.
    this.handleStateChange()
  }

  /**
   * Updates the configuration of the session.
   * @param config Updated configuration options to assign to the session config.
   */
  public updateConfig(config: Partial<TSessionConfig>): void {
    Object.assign(this._config, config)
    this.handleStateChange()
  }

  /**
   * Handles a new connection by an existing participant.
   * @param newConnection The new connection for a participant of the session.
   * @returns True if connection was replaced, false if the participant wasn't found.
   */
  public handleConnectionChange(newConnection: ClientConnection): boolean {
    this._participants.forEach(
      (participant: ClientConnection, index: number) => {
        if (participant.userId === newConnection.userId) {
          // Update index in participants with the new
          // connection.
          this._participants[index] = newConnection

          // Add session-specific listeners to the new
          // connection.
          this.addListeners(newConnection)

          // Return true.
          return true
        }
      },
    )

    // Return false if the participant wasn't found.
    return false
  }

  /**
   * Handles a change in the session state.
   */
  public handleStateChange(): void {
    // Emit an event to all users that the session state has changed.
    this.emitToUsers('session-state-change', {
      data: {
        state: this.state,
        config: this.config,
        participants: this.participants.map((client: ClientConnection) =>
          client.user.toJson(),
        ),
        supervisors: this.supervisors.map((client: ClientConnection) =>
          client.user.toJson(),
        ),
      },
    })

    // If the session has ended, then clear all users.
    if (this.state === 'ended') {
      this.clearUsers()
    }
  }

  /**
   * Has the given user (participant or supervisor) quit the session.
   * @param quitterID The ID of the user quiting the session.
   * @note Removes any session listeners for the user.
   */
  public quit(quitterID: string): void {
    // Find the supervisor in the list, if present.
    this._supervisors.forEach((supervisor: ClientConnection, index: number) => {
      if (supervisor.userId === quitterID) {
        // Remove the supervisor from the list.
        this._supervisors.splice(index, 1)

        // Handle quitting the session for the supervisor.
        supervisor.login.handleQuit()
      }
    })

    // Find the participant in the list, if present.
    this._participants.forEach(
      (participant: ClientConnection, index: number) => {
        if (participant.userId === quitterID) {
          // Remove the participant from the list.
          this._participants.splice(index, 1)

          // Remove session-specific listeners.
          this.removeListeners(participant)

          // Handle quitting the session for the participant.
          participant.login.handleQuit()
        }
      },
    )

    // Handle state change.
    this.handleStateChange()
  }

  /**
   * Deletes all users from the session.
   */
  public clearUsers(): void {
    // Remove all participants from the session by
    // forcing each participant to quit.
    this.participants.forEach((participant: ClientConnection) => {
      participant.login.handleQuit()
    })

    // Remove session-specific listeners from
    // each participant.
    this.participants.forEach((participant: ClientConnection) => {
      this.removeListeners(participant)
    })

    // Clear the participants list.
    this._participants = []
    // Clear the supervisors list.
    this._supervisors = []
  }

  /**
   * Kicks the given user from the session.
   * @param participantId The ID of the participant to kick from the session.
   */
  public kick(participantId: string): void {
    // Find the participant in the list, if present.
    this._participants.forEach(
      (participant: ClientConnection, index: number) => {
        if (participant.userId === participantId) {
          // If the participant is has supervisor permissions,
          // then throw 403 forbidden error.
          if (participant.user.isAuthorized('sessions_join_observer')) {
            throw 403
          }

          // Remove the participant from the list.
          this._participants.splice(index, 1)

          // Remove session-specific listeners.
          this.removeListeners(participant)

          // Handle quitting the session for the participant.
          participant.login.handleQuit()

          // Emit an event to the participant
          // that they have been kicked.
          participant.emit('kicked', { data: { sessionId: this._id } })
        }
      },
    )

    // Handle state change.
    this.handleStateChange()
  }

  /**
   * Bans the given user from the session.
   * @param participantId The ID of the participant to ban from the session.
   * @throws The correct HTTP status code for any errors that occur.
   */
  public ban(participantId: string): void {
    // Find the participant in the list, if present.
    this._participants.forEach(
      (participant: ClientConnection, index: number) => {
        if (participant.userId === participantId) {
          // If the participant is has supervisor permissions,
          // then throw 403 forbidden error.
          if (participant.user.isAuthorized('sessions_join_observer')) {
            throw 403
          }

          // Remove the participant from the list.
          this._participants.splice(index, 1)

          // Remove session-specific listeners.
          this.removeListeners(participant)

          // Handle quitting the session for the participant.
          participant.login.handleQuit()

          // Emit an event to the participant
          // that they have been kicked.
          participant.emit('banned', { data: { sessionId: this._id } })
        }
      },
    )

    // Add the participant to the ban list.
    this._banList.push(participantId)

    // Handle state change.
    this.handleStateChange()
  }

  /**
   * Creates session-specific listeners for the given particpant.
   */
  private addListeners(participant: ClientConnection): void {
    participant.addEventListener('request-open-node', (data) =>
      this.onRequestOpenNode(participant, data),
    )
    participant.addEventListener('request-execute-action', (data) =>
      this.onRequestExecuteAction(participant, data),
    )
  }

  /**
   * Removes session-specific listeners for the given participant.
   */
  private removeListeners(participant: ClientConnection): void {
    participant.clearEventListeners([
      'request-open-node',
      'request-execute-action',
    ])
  }

  /**
   * Emits an event to all the users joined in the session (participants and supervisors).
   */
  public emitToUsers<
    TMethod extends TServerMethod,
    TPayload extends Omit<TServerEvents[TMethod], 'method'>,
  >(method: TMethod, payload: TPayload): void {
    for (let user of this.users) {
      user.emit(method, payload)
    }
  }

  /**
   * Called when a participant requests to open a node.
   * @param participant The participant requesting to open a node.
   * @param event The event emitted by the participant.
   */
  public onRequestOpenNode = (
    participant: ClientConnection,
    event: TClientEvents['request-open-node'],
  ): void => {
    // Organize data.
    let mission: ServerMission = this.mission
    let { nodeId } = event.data

    // Find the node, given the ID.
    let node: ServerMissionNode | undefined = mission.getNode(nodeId)

    // If the session is not in the 'started' state,
    // then emit an error.
    if (this.state !== 'started') {
      return participant.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_PROGRESS_LOCKED,
          {
            request: participant.buildResponseReqData(event),
          },
        ),
      )
    }
    // If the node is undefined, then emit
    // an error.
    if (node === undefined) {
      return participant.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_NODE_NOT_FOUND, {
          request: participant.buildResponseReqData(event),
        }),
      )
    }
    // If the node is executable, then emit
    // an error.
    if (!node.openable) {
      return participant.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_NODE_NOT_OPENABLE, {
          request: participant.buildResponseReqData(event),
        }),
      )
    }

    try {
      // Open the node.
      node.open()

      // Construct open event payload.
      let payload: TServerEvents['node-opened'] = {
        method: 'node-opened',
        data: {
          nodeId: nodeId,
          revealedChildNodes: node.childNodes.map((node) =>
            node.toJson({ includeSessionData: true }),
          ),
        },
        request: { event, requesterId: participant.userId, fulfilled: true },
      }

      // Emit open event.
      for (let user of this.users) {
        user.emit('node-opened', payload)
      }
    } catch (error) {
      // Emit an error if the node could not be opened.
      participant.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_SERVER_ERROR, {
          request: participant.buildResponseReqData(event),
          message: 'Failed to open node.',
        }),
      )
    }
  }

  /**
   * Called when a participant requests to execute an action on a node.
   * @param participant The participant requesting to execute an action.
   * @param event The event emitted by the participant.
   * @resolves When the action has been executed or a client error is found.
   */
  public onRequestExecuteAction = async (
    participant: ClientConnection,
    event: TClientEvents['request-execute-action'],
  ): Promise<void> => {
    // Extract request data.
    let { actionId } = event.data

    // Find the action given the ID.
    let action: ServerMissionAction | undefined = this.actions.get(actionId)

    // If the session is not in the 'started' state,
    // then emit an error.
    if (this.state !== 'started') {
      return participant.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_PROGRESS_LOCKED,
          {
            request: participant.buildResponseReqData(event),
          },
        ),
      )
    }
    // If the action is undefined, then emit
    // an error.
    if (action === undefined) {
      return participant.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_ACTION_NOT_FOUND, {
          request: participant.buildResponseReqData(event),
        }),
      )
    }
    // If the action is not executable, then
    // emit an error.
    if (!action.node.executable) {
      return participant.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_NODE_NOT_EXECUTABLE, {
          request: participant.buildResponseReqData(event),
        }),
      )
    }
    // If the node is not revealed, then
    // emit an error.
    if (!action.node.revealed) {
      return participant.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_NODE_NOT_REVEALED, {
          request: participant.buildResponseReqData(event),
        }),
      )
    }
    // If the participant does not have enough
    // resources to execute the action, then
    // emit an error.
    if (this.resources < action.resourceCost) {
      return participant.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_ACTION_INSUFFICIENT_RESOURCES,
          {
            request: participant.buildResponseReqData(event),
          },
        ),
      )
    }

    try {
      // Execute the action, awaiting result.
      let outcome = await action.execute({
        effectsEnabled: this.config.effectsEnabled,
        onInit: (execution: ServerActionExecution) => {
          // Deduct action cost from resource pool.
          this._resources -= action!.resourceCost

          // Construct payload for action execution
          // initiated event.
          let initiationPayload: TServerEvents['action-execution-initiated'] = {
            method: 'action-execution-initiated',
            data: {
              execution: execution.toJson(),
            },
            request: {
              event,
              requesterId: participant.userId,
              fulfilled: false,
            },
          }

          // Emit action execution initiated event
          // to each user.
          for (let user of this.users) {
            user.emit('action-execution-initiated', initiationPayload)
          }
        },
      })

      // Construct payload for action execution
      // completed event.
      let completionPayload: TServerEvents['action-execution-completed'] = {
        method: 'action-execution-completed',
        data: {
          outcome: outcome.toJson(),
        },
        request: {
          event,
          requesterId: participant.userId,
          fulfilled: true,
        },
      }

      // Add child nodes if the action was
      // successful.
      if (outcome.successful) {
        completionPayload.data.revealedChildNodes = action.node.childNodes.map(
          (node) => node.toJson({ includeSessionData: true }),
        )
      }

      // Emit the action execution completed
      // event to each participant.
      for (let user of this.users) {
        user.emit('action-execution-completed', completionPayload)
      }
    } catch (error) {
      // Emit an error if the action could not be executed.
      participant.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_SERVER_ERROR, {
          request: participant.buildResponseReqData(event),
          message: 'Failed to execute action.',
        }),
      )
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
   * @returns A promise of the session server for the newly launched session.
   */
  public static launch(
    mission: ServerMission,
    config: Partial<TSessionConfig> = {},
  ): SessionServer {
    return new SessionServer(
      generateHash().substring(0, 12),
      mission.name,
      config,
      mission,
      [],
      [],
    )
  }

  /**
   * @returns the session associated with the given session ID.
   */
  public static get(_id: string | undefined): SessionServer | undefined {
    if (_id === undefined) {
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
}

/**
 * Options for converting a session to JSON.
 */
export type TSessionServerJsonOptions = {
  /**
   * Whether to include sensitive session data (ban list).
   * @default false
   */
  includeSensitiveData?: boolean
}
