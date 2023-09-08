import axios from 'axios'
import Game, { IGameJSON } from '../../../shared/games'
import User from '../../../shared/users'
import ServerConnection from 'src/connect/server'
import Mission from '../../../shared/missions'
import MissionNode from '../../../shared/missions/nodes'
import MissionNodeAction from '../../../shared/missions/actions'
import { TServerData } from '../../../shared/connect/data'

/**
 * Client instance for games. Handles client-side logic for games. Communicates with server to conduct game.
 */
export default class GameClient extends Game<User> {
  /**
   * The server connection used to communicate with the server.
   */
  protected server: ServerConnection

  // todo: Between the time the client joins and this object is constructed, there is possibility that changes have been made in the game. This should be handled.
  public constructor(
    gameID: string,
    mission: Mission,
    participants: Array<User>,
    server: ServerConnection,
  ) {
    super(gameID, mission, participants)
    this.server = server
    this.addListeners()
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

  // Implemented
  public toJSON(): IGameJSON {
    return {
      gameID: this.gameID,
      mission: this.mission.toJSON(true),
      participants: this.participants.map((user) => user.toJSON()),
    }
  }

  /**
   * Opens a node.
   * @param {string} nodeID The ID of the node to be opened.
   */
  public openNode(nodeID: string): void {
    let server: ServerConnection = this.server

    // Throw error if the node is not in
    // the mission associated with this
    // game.
    if (!this.mission.nodes.has(nodeID)) {
      throw Error('Node was not found in the mission.')
    }

    // Emit a request to open the node.
    server.emit('request-open-node', {
      method: 'request-open-node',
      requestID: ServerConnection.generateRequestID(),
      nodeID: nodeID,
    })
  }

  /**
   * Executes an action.
   * @param {string} actionID The ID of the action to be executed.
   */
  public executeAction(actionID: string): void {
    let server: ServerConnection = this.server

    // Throw error if the action is not in
    // the mission associated with this
    // game.
    if (!this.actions.has(actionID)) {
      throw Error('Action was not found in the mission.')
    }

    // Emit a request to execute the action.
    server.emit('request-execute-action', {
      method: 'request-execute-action',
      requestID: ServerConnection.generateRequestID(),
      actionID: actionID,
    })
  }

  /**
   * Handles when a node has been opened.
   * @param {TServerData<'node-opened'>} data The data sent from the server.
   */
  private onNodeOpened = (data: TServerData<'node-opened'>): void => {
    // Extract data.
    let { nodeID, revealedChildNodes: childNodes } = data

    // Find the node, given the ID.
    let node: MissionNode | undefined = this.mission.nodes.get(nodeID)

    // Handle node not found.
    if (node === undefined) {
      throw new Error(
        `Event "node-opened" was triggered, but the node with the given nodeID ("${nodeID}") could not be found.`,
      )
    }

    // Populate nodes.
    node.populateChildNodes(childNodes)

    // Remap actions.
    this.mapActions()

    // Open the node.
    node.open()
  }

  /**
   * Handles when action execution has been initiated.
   * @param {TServerData<'action-execution-initiated'>} data The data sent from the server.'
   */
  private onActionExecutionInitiated = (
    data: TServerData<'action-execution-initiated'>,
  ): void => {
    console.log('request-execution-initiated')
    // Extract data.
    let { actionID, expectedCompletionTime } = data

    // Find the action, given the ID.
    let action: MissionNodeAction | undefined = this.actions.get(actionID)

    // Handle action not found.
    if (action === undefined) {
      throw new Error(
        `Event "action-execution-initiated" was triggered, but the action with the given actionID ("${actionID}") could not be found.`,
      )
    }

    // Log to the console for now.
    console.log('Action execution initiated.')
  }

  /**
   * Handles when action execution has been completed.
   */
  private onActionExecutionCompleted = (
    data: TServerData<'action-execution-completed'>,
  ): void => {
    console.log('request-execution-completed')
    // Extract data.
    let { actionID, successful, revealedChildNodes } = data

    // Find the action, given the ID.
    let action: MissionNodeAction | undefined = this.actions.get(actionID)

    // Handle action not found.
    if (action === undefined) {
      throw new Error(
        `Event "action-execution-initiated" was triggered, but the action with the given actionID ("${actionID}") could not be found.`,
      )
    }

    // Extract node from action.
    let node: MissionNode = action.node

    // Handle action execution end.
    node._lastExecutedAction = action
    node._lastExecutionSucceeded = successful
    node._lastExecutionFailed = !successful

    // Populate child nodes.
    if (revealedChildNodes !== undefined) {
      node._isOpen = true
      node.populateChildNodes(revealedChildNodes)
    }
  }

  /**
   * Converts IGameJSON into a GameClient object.
   * @param {IGameJSON} json The json to be converted.
   * @param {ServerConnection} server The server connection used to communicate with the server.
   * @returns {GameClient} The GameClient object.
   */
  public static fromJSON(
    json: IGameJSON,
    server: ServerConnection,
  ): GameClient {
    let mission: Mission = Mission.fromJSON(json.mission)
    let participants: Array<User> = json.participants.map(
      (userJSON) => new User(userJSON),
    )
    return new GameClient(json.gameID, mission, participants, server)
  }

  /**
   * Launches a new game with a new game ID.
   * @param {string} missionID  The ID of the mission being executed in the game.
   * @returns {Promise<string>} A promise of the game ID for the newly launched game.
   */
  public static async launch(missionID: string): Promise<string> {
    return new Promise<string>(
      async (
        resolve: (game: string) => void,
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
   * @param {string} gameID The ID of the game to join.
   * @returns {Promise<GameClient>} A promise of the game client object.
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
          let game: GameClient = GameClient.fromJSON(gameJSON, server)

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
