import { v4 as generateHash } from 'uuid'
import { IMissionJSON, Mission } from './missions'
import { IUserJSON, User } from './users'
import axios, { AxiosError, AxiosResponse } from 'axios'
import context from './context'
import { MissionNodeAction } from './mission-node-actions'
import { MissionNode } from './mission-nodes'
import ServerConnection from './connect/server-connect'
import ClientConnection from './connect/client-connect'
import { IClientDataTypes, TServerData } from './connect/data'
import { ServerEmittedError } from './connect/errors'

export interface IGameJSON {
  gameID: string
  mission: IMissionJSON
  participants: Array<IUserJSON>
}

/**
 * Base class for a games. Represents a game being played by participating students in METIS.
 */
export abstract class Game<TParticpant extends { userID: string }> {
  /**
   * The ID of the game.
   */
  public readonly gameID: string

  /**
   * The mission being executed by the participants.
   */
  public readonly mission: Mission

  /**
   * The participants of the game executing the mission.
   */
  protected _participants: Array<TParticpant>

  /**
   * The participants of the game executing the mission.
   */
  public get participants(): Array<TParticpant> {
    return [...this._participants]
  }

  /**
   * A map of actionIDs to actions compiled from those found in the mission being executed.
   */
  protected actions: Map<string, MissionNodeAction> = new Map<
    string,
    MissionNodeAction
  >()

  /**
   * ** Note: Use the static method `launch` to create a new game with a new game ID. **
   */
  public constructor(
    gameID: string,
    mission: Mission,
    participants: Array<TParticpant>,
  ) {
    this.gameID = gameID
    this.mission = mission
    this._participants = participants
    this.mapActions()
  }

  /**
   * Loops through all the nodes in the mission, and each action in a node, and maps the actionID to the action in the field "actions".
   */
  protected mapActions(): void {
    // Initialize the actions map.
    this.actions = new Map<string, MissionNodeAction>()

    // Loops through and maps each action.
    this.mission.nodes.forEach((node) => {
      node.actions.forEach((action) => {
        this.actions.set(action.actionID, action)
      })
    })
  }

  /**
   * Checks if the given participant is currently in the game.
   * @param {User} participant The participant to check.
   * @returns Whether the given participant is joined into the game.
   */
  public isJoined(participant: TParticpant): boolean {
    for (let user of this._participants) {
      if (user.userID === participant.userID) {
        return true
      }
    }
    return false
  }

  /**
   * Has the given participant quit the game.
   * @param participantID {string} The ID of the participant quitting the game.
   * @returns {Promise<void>} A promise of the game quitting.
   */
  public async quit(participantID: string): Promise<void> {
    return new Promise<void>(
      (resolve: () => void, reject: (error: AxiosError) => void): void => {
        // If the context is react, then we need
        // to make a request to the server. The
        // server needs to handle the quitting of
        // the game, not the client.
        if (context === 'react') {
          axios
            .post<void>(`${Game.API_ENDPOINT}/quit/`)
            .then(resolve)
            .catch((error: AxiosError) => {
              console.error('Failed to quit game.')
              console.error(error)
              reject(error)
            })
        }
        // If the context is express, then we need
        // to quit the game here.
        else if (context === 'express') {
          for (let user of this._participants) {
            // If the user is in the game, then
            // we can remove them.
            if (user.userID === participantID) {
              this._participants = this._participants.filter(
                (user: TParticpant) => user.userID !== participantID,
              )
              return resolve()
            }
          }

          // If the user is not in the game, then
          // we cannot remove them.
          let error: AxiosError = new AxiosError('User is not in the game.')
          return reject(error)
        }
      },
    )
  }

  /**
   * Converts the Game object to JSON.
   * @returns {IGameJSON} A JSON representation of the game.
   */
  public abstract toJSON(): IGameJSON

  public static API_ENDPOINT: string = '/api/v1/games'
}

/**
 * Server instance for games. Handles server-side logic for a game with participating clients. Communicates with clients to conduct game.
 */
export class GameServer extends Game<ClientConnection> {
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
    return new Promise<string>(
      (
        resolve: (gameID: string) => void,
        reject: (error: AxiosError) => void,
      ): void => {
        let game: GameServer = new GameServer(generateHash(), mission, [])
        return resolve(game.gameID)
      },
    )
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
    // if (action.node.revealed) {
    //   return participant.emitError(
    //     new ServerEmittedError(ServerEmittedError.CODE_NODE_NOT_REVEALED, {
    //       request,
    //     }),
    //   )
    // }

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

/**
 * Client instance for games. Handles client-side logic for games. Communicates with server to conduct game.
 */
export class GameClient extends Game<User> {
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
      (userJSON: IUserJSON) => User.fromJSON(userJSON),
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

export default {}
