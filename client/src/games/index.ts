import axios from 'axios'
import ServerConnection from 'src/connect/servers'
import ClientMission from 'src/missions'
import ClientMissionAction from 'src/missions/actions'
import ClientMissionNode from 'src/missions/nodes'
import ClientUser from 'src/users'
import { TServerEvents } from '../../../shared/connect/data'
import Game, {
  TGameBasicJson,
  TGameConfig,
  TGameJson,
  TGameRole,
  TGameState,
} from '../../../shared/games'

/**
 * Client instance for games. Handles client-side logic for games. Communicates with server to conduct game.
 */
export default class GameClient extends Game<
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
   * The client's role in the game.
   */
  protected _role: TGameRole
  /**
   * The client's role in the game.
   */
  public get role(): TGameRole {
    return this._role
  }

  // todo: Between the time the client joins and this object is constructed, there is possibility that changes have been made in the game. This should be handled.
  public constructor(
    data: TGameJson,
    server: ServerConnection,
    role: TGameRole,
  ) {
    let _id: string = data._id
    let state: TGameState = data.state
    let name: string = data.name
    let mission: ClientMission = new ClientMission(data.mission)
    let participants: ClientUser[] = data.participants.map(
      (userData) => new ClientUser(userData),
    )
    let supervisors: ClientUser[] = data.supervisors.map(
      (userData) => new ClientUser(userData),
    )
    let banList: string[] = data.banList
    let config: TGameConfig = data.config

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

    // Loops through and maps each action.
    this.mission.nodes.forEach((node) => {
      node.actions.forEach((action) => {
        this.actions.set(action._id, action)
      })
    })
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
   * Creates game-specific listeners.
   */
  private addListeners(): void {
    this.server.addEventListener('game-state-change', this.onGameStateChange)
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
   * Removes game-specific listeners.
   */
  private removeListeners(): void {
    this.server.clearEventListeners([
      'game-state-change',
      'node-opened',
      'action-execution-initiated',
      'action-execution-completed',
    ])
  }

  // Implemented
  public toJson(): TGameJson {
    return {
      _id: this._id,
      state: this.state,
      name: this.name,
      mission: this.mission.toJson({
        revealedOnly: true,
      }),
      participants: this.participants.map((user) => user.toJson()),
      banList: this.banList,
      supervisors: this.supervisors.map((user) => user.toJson()),
      config: this.config,
      resources: this.resources === Infinity ? 'infinite' : this.resources,
    }
  }

  // Implemented
  public toBasicJson(): TGameBasicJson {
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
    // game.
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
    // game.
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
   * Request to quit the game.
   * @returns A promise that resolves when the game is quitted.
   */
  public async $quit(): Promise<void> {
    return new Promise<void>(
      async (
        resolve: () => void,
        reject: (error: any) => void,
      ): Promise<void> => {
        this.server.request('request-quit-game', {}, 'Quitting game.', {
          onResponse: (event) => {
            switch (event.method) {
              case 'game-quit':
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
   * Updates the game config.
   * @param configUpdates The updates to the game config.
   * @resolves When the game config has been updated.
   * @rejects If the game failed to update config, or if the game has already
   * started or ended.
   */
  public async $updateConfig(
    configUpdates: Partial<TGameConfig>,
  ): Promise<void> {
    return new Promise<void>(
      async (
        resolve: () => void,
        reject: (error: any) => void,
      ): Promise<void> => {
        try {
          // If the game has already started, throw an error.
          if (this.state === 'started') {
            throw new Error('Game has already started.')
          }
          // If the game has already ended, throw an error.
          if (this.state === 'ended') {
            throw new Error('Game has already ended.')
          }
          // Call API to update config.
          await axios.put(`${Game.API_ENDPOINT}/${this._id}/config/`, {
            ...configUpdates,
          })
          // Update the game config.
          Object.assign(this._config, configUpdates)
          // Resolve promise.
          return resolve()
        } catch (error) {
          console.error('Failed to update game config.')
          console.error(error)
          return reject(error)
        }
      },
    )
  }

  /**
   * Starts the game.
   * @resolves When the game has started.
   * @rejects If the game failed to start, or if the game has already
   * started or ended.
   */
  public async $start(): Promise<void> {
    return new Promise<void>(
      async (
        resolve: () => void,
        reject: (error: any) => void,
      ): Promise<void> => {
        try {
          // If the game has already started, throw an error.
          if (this.state === 'started') {
            throw new Error('Game has already started.')
          }
          // If the game has already ended, throw an error.
          if (this.state === 'ended') {
            throw new Error('Game has already ended.')
          }
          // Call API to start game.
          await axios.put(`${Game.API_ENDPOINT}/${this._id}/start/`)
          // Update the game state.
          this._state = 'started'
          // Resolve promise.
          return resolve()
        } catch (error) {
          console.error('Failed to start game.')
          console.error(error)
          return reject(error)
        }
      },
    )
  }

  /**
   * Ends the game.
   * @resolves When the game has ended.
   * @rejects If the game failed to end, or if the game has already
   * ended or has not yet started.
   */
  public async $end(): Promise<void> {
    return new Promise<void>(
      async (
        resolve: () => void,
        reject: (error: any) => void,
      ): Promise<void> => {
        try {
          // If the game is unstarted, throw an error.
          if (this.state === 'unstarted') {
            throw new Error('Game has not yet started.')
          }
          // If the game has already ended, throw an error.
          if (this.state === 'ended') {
            throw new Error('Game has already ended.')
          }
          // Call API to end game.
          await axios.put(`${Game.API_ENDPOINT}/${this._id}/end/`)
          // Update the game state.
          this._state = 'ended'
          // Resolve promise.
          return resolve()
        } catch (error) {
          console.error('Failed to end game.')
          console.error(error)
          return reject(error)
        }
      },
    )
  }

  /**
   * Kicks a participant from the game.
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
          await axios.put(`${Game.API_ENDPOINT}/${this._id}/kick/${userId}`)
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
   * Bans a participant from the game.
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
          await axios.put(`${Game.API_ENDPOINT}/${this._id}/ban/${userId}`)
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
   * Handles when the game state has changed.
   * @param event The event emitted by the server.
   */
  private onGameStateChange = (
    event: TServerEvents['game-state-change'],
  ): void => {
    // Extract data.
    let { state, config, participants, supervisors } = event.data

    // Update the game with the new data.
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
   * Fetches all games publicly available.
   * @resolves To the games.
   * @rejects If the games failed to be fetched.
   */
  public static $fetchAll(): Promise<TGameBasicJson[]> {
    return new Promise<TGameBasicJson[]>(
      async (
        resolve: (games: TGameBasicJson[]) => void,
        reject: (error: any) => void,
      ): Promise<void> => {
        try {
          // Call API to fetch all games.
          let games: TGameBasicJson[] = (
            await axios.get<TGameBasicJson[]>(Game.API_ENDPOINT)
          ).data
          return resolve(games)
        } catch (error) {
          console.error('Failed to fetch games.')
          console.error(error)
          return reject(error)
        }
      },
    )
  }

  /**
   * Launches a new game with a new game ID.
   * @param missionId  The ID of the mission being executed in the game.
   * @resolves To the game ID.
   * @rejects If the game failed to launch.
   */
  public static $launch(
    missionId: string,
    gameConfig: Partial<TGameConfig>,
  ): Promise<string> {
    return new Promise<string>(
      async (
        resolve: (gameId: string) => void,
        reject: (error: any) => void,
      ): Promise<void> => {
        try {
          // Call API to launch new game with
          // the mission ID. Await the generated
          // game ID.
          let { gameId } = (
            await axios.post<{ gameId: string }>(
              `${Game.API_ENDPOINT}/launch/`,
              {
                missionId,
                ...gameConfig,
              },
            )
          ).data
          return resolve(gameId)
        } catch (error) {
          console.error('Failed to launch game.')
          console.error(error)
          return reject(error)
        }
      },
    )
  }

  /**
   * Deletes a game with the given ID.
   * @param _id The ID of the game to be deleted.
   * @resolves When the game has been deleted.
   * @rejects If the game failed to be deleted.
   */
  public static $delete(_id: string): Promise<void> {
    return new Promise<void>(
      async (
        resolve: () => void,
        reject: (error: any) => void,
      ): Promise<void> => {
        try {
          // Call API to delete game.
          await axios.delete(`${Game.API_ENDPOINT}/${_id}`)
          return resolve()
        } catch (error) {
          console.error('Failed to delete game.')
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
