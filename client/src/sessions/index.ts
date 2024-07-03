import axios from 'axios'
import ServerConnection from 'src/connect/servers'
import ClientMission from 'src/missions'
import ClientMissionAction from 'src/missions/actions'
import ClientMissionNode from 'src/missions/nodes'
import ClientUser from 'src/users'
import { TServerEvents } from '../../../shared/connect/data'
import Session, {
  TSessionBasicJson,
  TSessionConfig,
  TSessionJson,
  TSessionRole,
  TSessionState,
} from '../../../shared/sessions'

/**
 * Client instance for sessions. Handles client-side logic for sessions. Communicates with server to conduct a session.
 */
export default class SessionClient extends Session<
  ClientUser,
  ClientMission,
  ClientMissionNode,
  ClientMissionAction
> {
  /**
   * The server connection used to communicate with the server.
   */
  protected server: ServerConnection

  /**
   * The resources available to the participants.
   */
  protected _resources: number

  // inherited
  public get resources(): number {
    return this._resources
  }

  /**
   * The client's role in the session.
   */
  protected _role: TSessionRole
  /**
   * The client's role in the session.
   */
  public get role(): TSessionRole {
    return this._role
  }

  // todo: Between the time the client joins and this object is constructed, there is possibility that changes have been made in the session. This should be handled.
  public constructor(
    data: TSessionJson,
    server: ServerConnection,
    role: TSessionRole,
  ) {
    let _id: string = data._id
    let state: TSessionState = data.state
    let name: string = data.name
    let mission: ClientMission = new ClientMission(data.mission)
    let participants: ClientUser[] = data.participants.map(
      (userData) => new ClientUser(userData),
    )
    let supervisors: ClientUser[] = data.supervisors.map(
      (userData) => new ClientUser(userData),
    )
    let banList: string[] = data.banList
    let config: TSessionConfig = data.config

    super(_id, name, config, mission, participants, banList, supervisors)
    this.server = server
    this._role = role
    this._state = state
    this._resources = data.resources === 'infinite' ? Infinity : data.resources

    this.addListeners()
  }

  // Implemented
  protected mapActions(): void {
    // Initialize the actions map.
    this.actions = new Map<string, ClientMissionAction>()

    // Loops through and add each action found.
    this.mission.forces.forEach((force) =>
      force.nodes.forEach((node) =>
        node.actions.forEach((action) => this.actions.set(action._id, action)),
      ),
    )
  }

  // Implemented
  public isJoined(user: ClientUser): boolean {
    for (let x of this.users) {
      if (x._id === user._id) {
        return true
      }
    }
    return false
  }

  // Implemented
  public isParticipant(user: ClientUser): boolean {
    for (let x of this.users) {
      if (x._id === user._id) {
        return true
      }
    }
    return false
  }

  // Implemented
  public isSupervisor(user: ClientUser): boolean {
    for (let x of this.supervisors) {
      if (x._id === user._id) {
        return true
      }
    }
    return false
  }

  /**
   * Creates session-specific listeners.
   */
  private addListeners(): void {
    this.server.addEventListener(
      'session-state-change',
      this.onSessionStateChange,
    )
    this.server.addEventListener('node-opened', this.onNodeOpened)
    this.server.addEventListener(
      'action-execution-initiated',
      this.onActionExecutionInitiated,
    )
    this.server.addEventListener(
      'action-execution-completed',
      this.onActionExecutionCompleted,
    )
  }

  /**
   * Removes session-specific listeners.
   */
  private removeListeners(): void {
    this.server.clearEventListeners([
      'session-state-change',
      'node-opened',
      'action-execution-initiated',
      'action-execution-completed',
    ])
  }

  // Implemented
  public toJson(): TSessionJson {
    return {
      _id: this._id,
      state: this.state,
      name: this.name,
      mission: this.mission.toJson({ exportType: 'session' }),
      participants: this.participants.map((user) => user.toJson()),
      banList: this.banList,
      supervisors: this.supervisors.map((user) => user.toJson()),
      config: this.config,
      resources: this.resources === Infinity ? 'infinite' : this.resources,
    }
  }

  // Implemented
  public toBasicJson(): TSessionBasicJson {
    return {
      _id: this._id,
      missionId: this.missionId,
      name: this.name,
      config: this.config,
      participantIds: this.participants.map(({ _id: userId }) => userId),
      banList: this.banList,
      supervisorIds: this.supervisors.map(({ _id: userId }) => userId),
    }
  }

  /**
   * Opens a node.
   * @param nodeId The ID of the node to be opened.
   */
  public openNode(nodeId: string, options: TOpenNodeOptions = {}): void {
    // Gather details.
    let server: ServerConnection = this.server
    let node: ClientMissionNode | undefined = this.mission.getNode(nodeId)
    let { onError = () => {} } = options

    // If the role is not "participant", callback
    // an error.
    if (this.role !== 'participant') {
      return onError('Only participants can open nodes.')
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
    let action: ClientMissionAction | undefined = this.actions.get(actionId)
    let { onError = () => {} } = options

    // If the role is not "participant", callback
    // an error.
    if (this.role !== 'participant') {
      return onError('Only participants can execute actions.')
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

    // Emit a request to execute the action.
    server.request(
      'request-execute-action',
      {
        actionId,
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
   * Request to quit the session.
   * @returns A promise that resolves when the session is quitted.
   */
  public async $quit(): Promise<void> {
    return new Promise<void>(
      async (
        resolve: () => void,
        reject: (error: any) => void,
      ): Promise<void> => {
        this.server.request('request-quit-session', {}, 'Quitting session.', {
          onResponse: (event) => {
            switch (event.method) {
              case 'session-quit':
                this.removeListeners()
                this.server.clearUnfulfilledRequests()
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
      },
    )
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
    return new Promise<void>(
      async (
        resolve: () => void,
        reject: (error: any) => void,
      ): Promise<void> => {
        try {
          // If the session has already started, throw an error.
          if (this.state === 'started') {
            throw new Error('Session has already started.')
          }
          // If the session has already ended, throw an error.
          if (this.state === 'ended') {
            throw new Error('Session has already ended.')
          }
          // Call API to update config.
          await axios.put(`${Session.API_ENDPOINT}/${this._id}/config/`, {
            ...configUpdates,
          })
          // Update the session config.
          Object.assign(this._config, configUpdates)
          // Resolve promise.
          return resolve()
        } catch (error) {
          console.error('Failed to update session config.')
          console.error(error)
          return reject(error)
        }
      },
    )
  }

  /**
   * Starts the session.
   * @resolves When the session has started.
   * @rejects If the session failed to start, or if the session has already
   * started or ended.
   */
  public async $start(): Promise<void> {
    return new Promise<void>(
      async (
        resolve: () => void,
        reject: (error: any) => void,
      ): Promise<void> => {
        try {
          // If the session has already started, throw an error.
          if (this.state === 'started') {
            throw new Error('Session has already started.')
          }
          // If the session has already ended, throw an error.
          if (this.state === 'ended') {
            throw new Error('Session has already ended.')
          }
          // Call API to start session.
          await axios.put(`${Session.API_ENDPOINT}/${this._id}/start/`)
          // Update the session state.
          this._state = 'started'
          // Resolve promise.
          return resolve()
        } catch (error) {
          console.error('Failed to start the session.')
          console.error(error)
          return reject(error)
        }
      },
    )
  }

  /**
   * Ends the session.
   * @resolves When the session has ended.
   * @rejects If the session failed to end, or if the session has already
   * ended or has not yet started.
   */
  public async $end(): Promise<void> {
    return new Promise<void>(
      async (
        resolve: () => void,
        reject: (error: any) => void,
      ): Promise<void> => {
        try {
          // If the session is unstarted, throw an error.
          if (this.state === 'unstarted') {
            throw new Error('Session has not yet started.')
          }
          // If the session has already ended, throw an error.
          if (this.state === 'ended') {
            throw new Error('Session has already ended.')
          }
          // Call API to end session.
          await axios.put(`${Session.API_ENDPOINT}/${this._id}/end/`)
          // Update the session state.
          this._state = 'ended'
          // Resolve promise.
          return resolve()
        } catch (error) {
          console.error('Failed to end the session.')
          console.error(error)
          return reject(error)
        }
      },
    )
  }

  /**
   * Kicks a participant from the session.
   * @param userId The ID of the user to be kicked.
   * @resolves When the user has been kicked.
   * @rejects If the user failed to be kicked.
   */
  public async $kick(userId: string): Promise<void> {
    return new Promise<void>(
      async (
        resolve: () => void,
        reject: (error: any) => void,
      ): Promise<void> => {
        try {
          // Call API to kick user.
          await axios.put(`${Session.API_ENDPOINT}/${this._id}/kick/${userId}`)
          // Resolve promise.
          return resolve()
        } catch (error) {
          console.error('Failed to kick user.')
          console.error(error)
          return reject(error)
        }
      },
    )
  }

  /**
   * Bans a participant from the session.
   * @param userId The ID of the user to be banned.
   * @resolves When the user has been banned.
   * @rejects If the user failed to be banned.
   */
  public async $ban(userId: string): Promise<void> {
    return new Promise<void>(
      async (
        resolve: () => void,
        reject: (error: any) => void,
      ): Promise<void> => {
        try {
          // Call API to ban user.
          await axios.put(`${Session.API_ENDPOINT}/${this._id}/ban/${userId}`)
          // Resolve promise.
          return resolve()
        } catch (error) {
          console.error('Failed to ban user.')
          console.error(error)
          return reject(error)
        }
      },
    )
  }

  /**
   * Handles when the session state has changed.
   * @param event The event emitted by the server.
   */
  private onSessionStateChange = (
    event: TServerEvents['session-state-change'],
  ): void => {
    // Extract data.
    let { state, config, participants, supervisors } = event.data

    // Update the session with the new data.
    this._state = state
    this._config = config
    this._participants = participants.map(
      (userData) => new ClientUser(userData),
    )
    this._supervisors = supervisors.map((userData) => new ClientUser(userData))
  }

  /**
   * Handles when a node has been opened.
   * @param event The event emitted by the server.
   */
  private onNodeOpened = (event: TServerEvents['node-opened']): void => {
    // Extract data.
    let { nodeId, revealedChildNodes } = event.data

    // Find the node, given the ID.
    let node: ClientMissionNode | undefined = this.mission.getNode(nodeId)

    // Handle node not found.
    if (node === undefined) {
      throw new Error(
        `Event "node-opened" was triggered, but the node with the given nodeId ("${nodeId}") could not be found.`,
      )
    }

    // Open node, if there are revealed
    // child nodes.
    if (revealedChildNodes !== undefined) {
      node.open({ revealedChildNodes })
      // Remap actions, since new actions
      // may have been populated.
      this.mapActions()
    }
  }

  /**
   * Handles when action execution has been initiated.
   * @param event The event emitted by the server.'
   */
  private onActionExecutionInitiated = (
    event: TServerEvents['action-execution-initiated'],
  ): void => {
    // Extract data.
    let { execution: executionData } = event.data
    let { actionId } = executionData

    // Find the action and node, given the action ID.
    let action: ClientMissionAction | undefined = this.actions.get(actionId)
    let node: ClientMissionNode

    // Handle action not found.
    if (action === undefined) {
      throw new Error(
        `Event "action-execution-initiated" was triggered, but the action with the given actionId ("${actionId}") could not be found.`,
      )
    }
    // Handle action found.
    else {
      node = action.node
    }

    // Handle execution on the node.
    node.loadExecution(executionData)

    // Deduct resources from pool.
    this._resources -= action.resourceCost
  }

  /**
   * Handles when action execution has been completed.
   * @param event The event emitted by the server.
   */
  private onActionExecutionCompleted = (
    event: TServerEvents['action-execution-completed'],
  ): void => {
    // Extract data.
    let { outcome, revealedChildNodes } = event.data
    let { actionId } = outcome

    // Find the action given the action ID.
    let action: ClientMissionAction | undefined = this.actions.get(actionId)

    // Handle action not found.
    if (action === undefined) {
      throw new Error(
        `Event "action-execution-initiated" was triggered, but the action with the given actionId ("${actionId}") could not be found.`,
      )
    }

    // Get the action's node.
    let node: ClientMissionNode = action.node

    // Generate an outcome object.

    // Handle outcome on the node.
    node.loadOutcome(outcome, { revealedChildNodes })

    // Remap actions if there are revealed nodes, since
    // those revealed nodes may contain new actions.
    if (revealedChildNodes !== undefined) {
      this.mapActions()
    }
  }

  /**
   * Fetches all sessions publicly available.
   * @resolves To the sessions.
   * @rejects If the sessions failed to be fetched.
   */
  public static $fetchAll(): Promise<TSessionBasicJson[]> {
    return new Promise<TSessionBasicJson[]>(
      async (
        resolve: (sessions: TSessionBasicJson[]) => void,
        reject: (error: any) => void,
      ): Promise<void> => {
        try {
          // Call API to fetch all sessions.
          let sessions: TSessionBasicJson[] = (
            await axios.get<TSessionBasicJson[]>(Session.API_ENDPOINT)
          ).data
          return resolve(sessions)
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
  public static $launch(
    missionId: string,
    sessionConfig: Partial<TSessionConfig>,
  ): Promise<string> {
    return new Promise<string>(
      async (
        resolve: (sessionId: string) => void,
        reject: (error: any) => void,
      ): Promise<void> => {
        try {
          // Call API to launch new session with
          // the mission ID. Await the generated
          // session ID.
          let { sessionId } = (
            await axios.post<{ sessionId: string }>(
              `${Session.API_ENDPOINT}/launch/`,
              {
                missionId,
                ...sessionConfig,
              },
            )
          ).data
          return resolve(sessionId)
        } catch (error) {
          console.error('Failed to launch session.')
          console.error(error)
          return reject(error)
        }
      },
    )
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
          await axios.delete(`${Session.API_ENDPOINT}/${_id}`)
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

/**
 * Options for node functions that perform actions on
 * the server via WS.
 */
type TNodeFuncOptions = {
  /**
   * Callback for errors.
   * @param message The error message.
   */
  onError?: (message: string) => void
}

/**
 * Options for `openNode` method.
 */
export interface TOpenNodeOptions extends TNodeFuncOptions {}

/**
 * Options for `executeAction` method.
 */
export interface TExecuteActionOptions extends TNodeFuncOptions {}
