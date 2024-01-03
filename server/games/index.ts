import Game, { IGameJSON } from 'metis/games'
import ClientConnection from 'metis/server/connect/clients'
import { v4 as generateHash } from 'uuid'
import { ServerEmittedError } from 'metis/connect/errors'
import ServerMission from 'metis/server/missions'
import ServerMissionNode from 'metis/server/missions/nodes'
import ServerMissionAction from 'metis/server/missions/actions'
import ServerActionExecution from '../missions/actions/executions'
import { TClientEvents, TServerEvents } from 'metis/connect/data'

/**
 * Server instance for games. Handles server-side logic for a game with participating clients. Communicates with clients to conduct game.
 */
export default class GameServer extends Game<
  ClientConnection,
  ServerMission,
  ServerMissionNode,
  ServerMissionAction
> {
  /**
   * The resources available to the participants.
   */
  protected _resources: number

  // Inherited
  public get resources(): number {
    return this._resources
  }

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
    mission: ServerMission,
    participants: Array<ClientConnection>,
  ) {
    super(gameID, mission, participants)
    this._resources = mission.initialResources
    this._destroyed = false
    this.register()
  }

  // Implemented
  public toJSON(): IGameJSON {
    return {
      gameID: this.gameID,
      mission: this.mission.toJSON({
        revealedOnly: true,
        includeGameData: true,
      }),
      participants: this.participants.map((client: ClientConnection) =>
        client.user.toJSON(),
      ),
      resources: this.resources,
    }
  }

  // Implemented
  protected mapActions(): void {
    // Initialize the actions map.
    this.actions = new Map<string, ServerMissionAction>()

    // Loops through and maps each action.
    this.mission.nodes.forEach((node) => {
      node.actions.forEach((action) => {
        this.actions.set(action.actionID, action)
      })
    })
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

    // Call join handler in the session of
    // the new participant.
    participant.session.handleJoin(this.gameID)
  }

  /**
   * Handles a new connection by an existing participant.
   * @param newConnection The new connection for a participant of the game.
   * @returns True if connection was replaced, false if the participant wasn't found.
   */
  public handleConnectionChange(newConnection: ClientConnection): boolean {
    this._participants.forEach(
      (participant: ClientConnection, index: number) => {
        if (participant.userID === newConnection.userID) {
          // Update index in participants with the new
          // connection.
          this._participants[index] = newConnection

          // Add game-specific listeners to the new
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
   * Has the given participant quit the game. Removes any game listeners for the user.
   * @param quitterID The ID of the participant quiting the game.
   */
  public quit(quitterID: string): void {
    // Find the participant in the list.
    this._participants.forEach(
      (participant: ClientConnection, index: number) => {
        if (participant.userID === quitterID) {
          // Remove the participant from the list.
          this._participants.splice(index, 1)

          // Remove game-specific listeners.
          this.removeListeners(participant)

          // Call quit handler in the session of
          // the determined participant.
          participant.session.handleQuit()
        }
      },
    )
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
   * Removes game-specific listeners for the given participant.
   */
  private removeListeners(participant: ClientConnection): void {
    participant.clearEventListeners([
      'request-open-node',
      'request-execute-action',
    ])
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
   * @param mission The mission from which to launch a game.
   * @returns A promise of the game server for the newly launched game.
   */
  public static launch(mission: ServerMission): GameServer {
    return new GameServer(generateHash(), mission, [])
  }

  /**
   * Quits the game for the given participant.
   */
  public static quit(participant: ClientConnection): void {}

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
   * @param participant The participant requesting to open a node.
   * @param event The event emitted by the participant.
   */
  public onRequestOpenNode = (
    participant: ClientConnection,
    event: TClientEvents['request-open-node'],
  ): void => {
    // Organize data.
    let mission: ServerMission = this.mission
    let { nodeID } = event.data

    // Find the node, given the ID.
    let node: ServerMissionNode | undefined = mission.getNode(nodeID)

    // If the node is undefined, then emit
    // an error.
    if (node === undefined) {
      return participant.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_NODE_NOT_FOUND, {
          request: event,
        }),
      )
    }
    // If the node is executable, then emit
    // an error.
    if (!node.openable) {
      return participant.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_NODE_NOT_OPENABLE, {
          request: event,
        }),
      )
    }

    // Open the node.
    node.open()

    // Construct open event payload.
    let payload: TServerEvents['node-opened'] = {
      method: 'node-opened',
      data: {
        nodeID,
        revealedChildNodes: node.childNodes.map((node) =>
          node.toJSON({ includeGameData: true }),
        ),
      },
      request: { event, requesterId: participant.userID, fulfilled: true },
    }

    setTimeout(() => {
      // Emit open event.
      for (let participant of this.participants) {
        participant.emit('node-opened', payload)
      }
    }, 2000)
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
    setTimeout(async () => {
      // Extract request data.
      let { actionID } = event.data

      // Find the action given the ID.
      let action: ServerMissionAction | undefined = this.actions.get(actionID)

      // If the action is undefined, then emit
      // an error.
      if (action === undefined) {
        return participant.emitError(
          new ServerEmittedError(ServerEmittedError.CODE_ACTION_NOT_FOUND, {
            request: event,
          }),
        )
      }
      // If the action is not executable, then
      // emit an error.
      if (!action.node.executable) {
        return participant.emitError(
          new ServerEmittedError(ServerEmittedError.CODE_NODE_NOT_EXECUTABLE, {
            request: event,
          }),
        )
      }
      // If the node is not revealed, then
      // emit an error.
      if (!action.node.revealed) {
        return participant.emitError(
          new ServerEmittedError(ServerEmittedError.CODE_NODE_NOT_REVEALED, {
            request: event,
          }),
        )
      }

      // Execute the action, awaiting result.
      let outcome = await action.execute({
        enactEffects: false,
        onInit: (execution: ServerActionExecution) => {
          // Deduct action cost from resource pool.
          this._resources -= action!.resourceCost

          // Construct payload for action execution
          // initiated event.
          let initiationPayload: TServerEvents['action-execution-initiated'] = {
            method: 'action-execution-initiated',
            data: {
              execution: execution.toJSON(),
            },
            request: {
              event,
              requesterId: participant.userID,
              fulfilled: false,
            },
          }

          // Emit action execution initiated event
          // to each participant.
          for (let participant of this.participants) {
            participant.emit('action-execution-initiated', initiationPayload)
          }
        },
      })

      // Construct payload for action execution
      // completed event.
      let completionPayload: TServerEvents['action-execution-completed'] = {
        method: 'action-execution-completed',
        data: {
          outcome: outcome.toJSON(),
        },
        request: {
          event,
          requesterId: participant.userID,
          fulfilled: true,
        },
      }

      // Add child nodes if the action was
      // successful.
      if (outcome.successful) {
        completionPayload.data.revealedChildNodes = action.node.childNodes.map(
          (node) => node.toJSON({ includeGameData: true }),
        )
      }

      setTimeout(() => {
        // Emit the action execution completed
        // event to each participant.
        for (let participant of this.participants) {
          participant.emit('action-execution-completed', completionPayload)
        }
      }, 2000)
    }, 2000)
  }
}
