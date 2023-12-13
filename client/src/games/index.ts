import axios from 'axios'
import Game, { IGameJson } from '../../../shared/games'
import ServerConnection from 'src/connect/server'
import { IServerDataTypes, TServerData } from '../../../shared/connect/data'
import ClientMission from 'src/missions'
import ClientMissionNode from 'src/missions/nodes'
import ClientMissionAction from 'src/missions/actions'
import { TActionExecutionJSON } from '../../../shared/missions/actions/executions'
import ClientUser from 'src/users'

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

  // todo: Between the time the client joins and this object is constructed, there is possibility that changes have been made in the game. This should be handled.
  public constructor(data: IGameJson, server: ServerConnection) {
    let gameID: string = data.gameID
    let mission: ClientMission = new ClientMission(data.mission)
    let participants: ClientUser[] = data.participants.map(
      (userData) => new ClientUser(userData),
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

  // Implemented
  public toJson(): IGameJson {
    return {
      gameID: this.gameID,
      mission: this.mission.toJson({ revealedOnly: true }),
      participants: this.participants.map((user) => user.toJson()),
      resources: this.resources,
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
    let { nodeID, revealedChildNodes } = data

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
   * @param {TServerData<'action-execution-initiated'>} data The data sent from the server.'
   */
  private onActionExecutionInitiated = (
    data: IServerDataTypes['action-execution-initiated'],
  ): void => {
    // Extract data.
    let executionData: NonNullable<TActionExecutionJSON> = data.execution
    let actionID: string = executionData.actionID

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
   */
  private onActionExecutionCompleted = (
    data: TServerData<'action-execution-completed'>,
  ): void => {
    // Extract data.
    let { outcome, revealedChildNodes } = data
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
          let gameJSON: IGameJson = (
            await axios.put<IGameJson>(`${Game.API_ENDPOINT}/join/`, {
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
