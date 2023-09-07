import Game, { IGameJSON } from 'metis/games'
import ClientConnection from 'metis/server/connect/clients'
import Mission from 'metis/missions'
import { v4 as generateHash } from 'uuid'
import { IClientDataTypes, TServerData } from 'metis/connect/data'
import { ServerEmittedError } from 'metis/connect/errors'
import MissionNode from 'metis/missions/nodes'
import MissionNodeAction from 'metis/missions/actions'

/**
 * Server instance for games. Handles server-side logic for a game with participating clients. Communicates with clients to conduct game.
 */
export default class GameServer extends Game<ClientConnection> {
  /**
   * Whether the game has been destroyed.
   */
  private _destroyed: boolean

  /**
   * Whether the game has been destroyed.
   */
  public get destroyed(): boolean {
    return this._destroyed
  }

  public constructor(
    gameID: string,
    mission: Mission,
    participants: Array<ClientConnection>,
  ) {
    super(gameID, mission, participants)
    this._destroyed = false
    this.register()
  }

  // Implemented
  public toJSON(): IGameJSON {
    return {
      gameID: this.gameID,
      mission: this.mission.toJSON(true),
      participants: this.participants.map((client: ClientConnection) =>
        client.user.toJSON(),
      ),
    }
  }

  /**
   * Adds this game into the registry, indexing it with its game ID.
   */
  private register(): void {
    GameServer.registry.set(this.gameID, this)
  }

  /**
   * Removes this game from the registry.
   */
  private unregister(): void {
    GameServer.registry.delete(this.gameID)
  }

  /**
   * Destroys the game.
   */
  public destroy(): void {
    this.unregister()
    this._destroyed = true
  }

  /**
   * Has the given participant join the game. Establishes listeners to handle events emitted by the participant's web socket connection.
   */
  public join(participant: ClientConnection): void {
    // Add participant to the participant list.
    this._participants.push(participant)

    // Add game-specific listeners.
    this.addListeners(participant)
  }

  /**
   * Creates game-specific listeners for the given particpant.
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
   * A registry of all games currently launched.
   */
  private static registry: Map<string, GameServer> = new Map<
    string,
    GameServer
  >()

  /**
   * Launches a new game with a new game ID.
   * @param {string} mission  The ID of the mission being executed in the game.
   * @returns {Promise<string>} A promise of the game ID for the newly launched game.
   */
  public static async launch(mission: Mission): Promise<string> {
    return new Promise<string>((resolve: (gameID: string) => void): void => {
      let game: GameServer = new GameServer(generateHash(), mission, [])
      return resolve(game.gameID)
    })
  }

  /**
   * @returns the game associated with the given game ID.
   */
  public static get(gameID: string | undefined): GameServer | undefined {
    if (gameID === undefined) {
      return undefined
    } else {
      return GameServer.registry.get(gameID)
    }
  }

  /**
   * Destroys the session associated with the given user ID.
   */
  public static destroy(userID: string | undefined): void {
    let game: GameServer | undefined = GameServer.get(userID)

    if (game !== undefined) {
      game.destroy()
    }
  }

  /**
   * Called when a participant requests to open a node.
   */
  public onRequestOpenNode = (
    participant: ClientConnection,
    request: IClientDataTypes['request-open-node'],
  ): void => {
    // Organize data.
    let mission: Mission = this.mission
    let { nodeID } = request

    // Find the node, given the ID.
    let node: MissionNode | undefined = mission.nodes.get(nodeID)

    // If the node is undefined, then emit
    // an error.
    if (node === undefined) {
      return participant.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_NODE_NOT_FOUND, {
          request,
        }),
      )
    }
    // If the node is executable, then emit
    // an error.
    if (!node.openable) {
      return participant.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_NODE_NOT_OPENABLE, {
          request,
        }),
      )
    }

    // Open the node.
    node.open()

    // Construct open event payload.
    let payload: TServerData<'node-opened'> = {
      method: 'node-opened',
      nodeID,
      revealedChildNodes: node.childNodes.map((node) => node.toJSON()),
      request,
      requesterID: participant.userID,
    }

    // Emit open event.
    for (let participant of this.participants) {
      participant.emit('node-opened', payload)
    }
  }

  /**
   * Called when a participant requests to execute an action on a node.
   */
  public onRequestExecuteAction = async (
    participant: ClientConnection,
    request: IClientDataTypes['request-execute-action'],
  ): Promise<void> => {
    console.log('request-execute-action')

    // Extract request data.
    let { actionID } = request

    // Find the action given the ID.
    let action: MissionNodeAction | undefined = this.actions.get(actionID)

    // If the action is undefined, then emit
    // an error.
    if (action === undefined) {
      return participant.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_ACTION_NOT_FOUND, {
          request,
        }),
      )
    }
    // If the action is not executable, then
    // emit an error.
    if (!action.node.executable) {
      return participant.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_NODE_NOT_EXECUTABLE, {
          request,
        }),
      )
    }
    // If the node is not revealed, then
    // emit an error.
    if (!action.node.revealed) {
      return participant.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_NODE_NOT_REVEALED, {
          request,
        }),
      )
    }

    // Get nodeID.
    let nodeID: string = action.node.nodeID

    // Determine expected completion time.
    let expectedCompletionTime: number = Date.now() + action.processTime

    // Construct payload for action execution
    // initiated event.
    let initiationPayload: TServerData<'action-execution-initiated'> = {
      method: 'action-execution-initiated',
      actionID,
      expectedCompletionTime,
      request,
    }

    // Emit action execution initiated event
    // to each participant.
    for (let participant of this.participants) {
      participant.emit('action-execution-initiated', initiationPayload)
    }

    // Execute the action, awaiting result.
    let { success: successful } = await action.execute({ enactEffects: false })

    // Construct payload for action execution
    // completed event.
    let completionPayload: TServerData<'action-execution-completed'> = {
      method: 'action-execution-completed',
      actionID,
      nodeID,
      successful,
      request,
      requesterID: participant.userID,
    }

    // Add child nodes if the action was
    // successful.
    if (successful) {
      completionPayload.revealedChildNodes = action.node.childNodes.map(
        (node) => node.toJSON(),
      )
    }

    // Emit the action execution completed
    // event to each participant.
    for (let participant of this.participants) {
      participant.emit('action-execution-completed', completionPayload)
    }
  }
}
