import axios from 'axios'
import Game, { IGameJSON } from '../../../shared/games'
import User from '../../../shared/users'
import ServerConnection from 'src/connect/servers'
import { TServerEvents } from '../../../shared/connect/data'
import ClientMission from 'src/missions'
import ClientMissionNode from 'src/missions/nodes'
import ClientMissionAction from 'src/missions/actions'
import { TActionExecutionJSON } from '../../../shared/missions/actions/executions'

/**
 * Client instance for games. Handles client-side logic for games. Communicates with server to conduct game.
 */
export default class GameClient extends Game<
  User,
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

  // todo: Between the time the client joins and this object is constructed, there is possibility that changes have been made in the game. This should be handled.
  public constructor(data: IGameJSON, server: ServerConnection) {
    let gameID: string = data.gameID
    let mission: ClientMission = new ClientMission(data.mission)
    let participants: Array<User> = data.participants.map(
      (userData) => new User(userData),
    )

    super(gameID, mission, participants)
    this.server = server
    this._resources = data.resources
    this.addListeners()
  }

  // Implemented
  protected mapActions(): void {
    // Initialize the actions map.
    this.actions = new Map<string, ClientMissionAction>()

    // Loops through and maps each action.
    this.mission.nodes.forEach((node) => {
      node.actions.forEach((action) => {
        this.actions.set(action.actionID, action)
      })
    })
  }

  /**
   * Creates game-specific listeners for the given particpant.
   */
  private addListeners(): void {
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
   * Removes game-specific listeners for the given particpant.
   */
  private removeListeners(): void {
    this.server.clearEventListeners([
      'node-opened',
      'action-execution-initiated',
      'action-execution-completed',
    ])
  }

  // Implemented
  public toJSON(): IGameJSON {
    return {
      gameID: this.gameID,
      mission: this.mission.toJSON({ revealedOnly: true }),
      participants: this.participants.map((user) => user.toJSON()),
      resources: this.resources,
    }
  }

  /**
   * Opens a node.
   * @param {string} nodeID The ID of the node to be opened.
   * @throws If the node is not in the mission associated with this game.
   * @throws If the node is not openable.
   */
  public openNode(nodeID: string): void {
    let server: ServerConnection = this.server
    let node: ClientMissionNode | undefined = this.mission.nodes.get(nodeID)

    // Throw error if the node is not in
    // the mission associated with this
    // game.
    if (node === undefined) {
      throw Error('Node was not found in the mission.')
    }
    // If the node is not openable, throw
    // an error.
    if (!node.openable) {
      throw Error('Node is not openable.')
    }

    // Set pending state on the node.
    node.pendingOpen = true

    // Emit a request to open the node.
    server.request('request-open-node', {
      nodeID,
    })
  }

  /**
   * Executes an action.
   * @param actionID The ID of the action to be executed.
   * @throws If the action is not in the mission associated with this game.
   * @throws If the action's node is not executable.
   */
  public executeAction(actionID: string): void {
    let server: ServerConnection = this.server
    let action: ClientMissionAction | undefined = this.actions.get(actionID)

    // Throw error if the action is not in
    // the mission associated with this
    // game.
    if (action === undefined) {
      throw Error('Action was not found in the mission.')
    }
    // If the action is not executable, throw
    // an error.
    if (!action.node.executable) {
      throw Error('Node is not executable.')
    }

    // Set pending state on the node.
    action.node.pendingExecInit = true

    // Emit a request to execute the action.
    server.request('request-execute-action', {
      actionID,
    })
  }

  /**
   * Request to quit the game.
   * @returns A promise that resolves when the game is quitted.
   */
  public async quit(): Promise<void> {
    return new Promise<void>(
      async (
        resolve: () => void,
        reject: (error: any) => void,
      ): Promise<void> => {
        try {
          // Call API to quit the game.
          await axios.delete(`${Game.API_ENDPOINT}/quit/`)

          // Remove listeners.
          this.removeListeners()

          // Resolve the promise.
          return resolve()
        } catch (error) {
          console.error('Failed to join game.')
          console.error(error)
          return reject(error)
        }
      },
    )
  }

  /**
   * Handles when a node has been opened.
   * @param event The event emitted by the server.
   */
  private onNodeOpened = (event: TServerEvents['node-opened']): void => {
    // Extract data.
    let { nodeID, revealedChildNodes } = event.data

    // Find the node, given the ID.
    let node: ClientMissionNode | undefined = this.mission.nodes.get(nodeID)

    // Handle node not found.
    if (node === undefined) {
      throw new Error(
        `Event "node-opened" was triggered, but the node with the given nodeID ("${nodeID}") could not be found.`,
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
    let { actionID } = executionData

    // Find the action and node, given the action ID.
    let action: ClientMissionAction | undefined = this.actions.get(actionID)
    let node: ClientMissionNode

    // Handle action not found.
    if (action === undefined) {
      throw new Error(
        `Event "action-execution-initiated" was triggered, but the action with the given actionID ("${actionID}") could not be found.`,
      )
    }
    // Handle action found.
    else {
      node = action.node
    }

    // Handle execution on the node.
    node.handleExecution(executionData)

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
    let { actionID } = outcome

    // Find the action given the action ID.
    let action: ClientMissionAction | undefined = this.actions.get(actionID)

    // Handle action not found.
    if (action === undefined) {
      throw new Error(
        `Event "action-execution-initiated" was triggered, but the action with the given actionID ("${actionID}") could not be found.`,
      )
    }

    // Get the action's node.
    let node: ClientMissionNode = action.node

    // Generate an outcome object.

    // Handle outcome on the node.
    node.handleOutcome(outcome, { revealedChildNodes })

    // Remap actions if there are revealed nodes, since
    // those revealed nodes may contain new actions.
    if (revealedChildNodes !== undefined) {
      this.mapActions()
    }
  }

  /**
   * Fetches the currently joined game for the user.
   * @note Only call this if the user has joined a game. Otherwise a 404 error will occur.
   * @param server The current connection to the server.
   * @returns A promise of the game client for the currently joined game.
   */
  public static async fetch(server: ServerConnection): Promise<GameClient> {
    return new Promise<GameClient>(
      async (
        resolve: (game: GameClient) => void,
        reject: (error: any) => void,
      ): Promise<void> => {
        try {
          // Call API to join the game with
          // the given game ID. Await the
          // game JSON.
          let gameJSON: IGameJSON = (
            await axios.get<IGameJSON>(Game.API_ENDPOINT)
          ).data

          // Convert the game JSON into a
          // GameClient object.
          let game: GameClient = new GameClient(gameJSON, server)

          // Resolve the promise with the
          // game object.
          return resolve(game)
        } catch (error) {
          console.error('Failed to fetch game client.')
          console.error(error)
          return reject(error)
        }
      },
    )
  }

  /**
   * Launches a new game with a new game ID.
   * @param {string} missionID  The ID of the mission being executed in the game.
   * @returns {Promise<string>} A promise of the game ID for the newly launched game.
   */
  public static async launch(missionID: string): Promise<string> {
    return new Promise<string>(
      async (
        resolve: (gameID: string) => void,
        reject: (error: any) => void,
      ): Promise<void> => {
        try {
          // Call API to launch new game with
          // the mission ID. Await the generated
          // game ID.
          let { gameID } = (
            await axios.post<{ gameID: string }>(
              `${Game.API_ENDPOINT}/launch/`,
              {
                missionID,
              },
            )
          ).data
          return resolve(gameID)
        } catch (error) {
          console.error('Failed to launch game.')
          console.error(error)
          return reject(error)
        }
      },
    )
  }

  /**
   * Request to join the game with the given game ID.
   * @param gameID The ID of the game to join.
   * @param server The current connection to the server.
   * @returns A promise of the game client object.
   */
  public static async join(
    gameID: string,
    server: ServerConnection,
  ): Promise<GameClient> {
    return new Promise<GameClient>(
      async (
        resolve: (game: GameClient) => void,
        reject: (error: any) => void,
      ): Promise<void> => {
        try {
          // Call API to join the game with
          // the given game ID. Await the
          // game JSON.
          let gameJSON: IGameJSON = (
            await axios.put<IGameJSON>(`${Game.API_ENDPOINT}/join/`, {
              gameID,
            })
          ).data

          // Convert the game JSON into a
          // GameClient object.
          let game: GameClient = new GameClient(gameJSON, server)

          // Resolve the promise with the
          // game object.
          return resolve(game)
        } catch (error) {
          console.error('Failed to join game.')
          console.error(error)
          return reject(error)
        }
      },
    )
  }
}
