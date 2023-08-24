import { v4 as generateHash } from 'uuid'
import { IMissionJSON, Mission } from './missions'
import { IUserJSON, User } from './users'
import axios, { AxiosError, AxiosResponse } from 'axios'
import context from './context'
import { MissionNodeAction } from './mission-node-actions'
import { MissionNode } from './mission-nodes'
import ServerConnection from './connect/server-connect'
import { register } from 'ts-node'
import ClientConnection from './connect/client-connect'

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
  private _participants: Array<TParticpant>

  /**
   * The participants of the game executing the mission.
   */
  public get participants(): Array<TParticpant> {
    return [...this._participants]
  }

  /**
   * A map of actionIDs to actions compiled from those found in the mission being executed.
   */
  private actions: Map<string, MissionNodeAction> = new Map<
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
  private mapActions(): void {
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
   * Opens the given node, making its children visible.
   * @param {nodeID} string The ID of the node to be opened.
   * @returns {Promise<void>} A promise of the action being executed.
   */
  public async open(nodeID: string): Promise<void> {
    return new Promise<void>(
      (resolve: () => void, reject: (error: AxiosError) => void): void => {
        // If the context is react, then we need
        // to make a request to the server. The
        // server needs to handle the opening of
        // the node, not the client.
        if (context === 'react') {
          axios
            .post<void>(`${Game.API_ENDPOINT}/open/`, { nodeID })
            .then(resolve)
            .catch((error: AxiosError) => {
              console.error('Failed to open node.')
              console.error(error)
              reject(error)
            })
        }
        // If the context is express, then we need
        // to execute the action here.
        else if (context === 'express') {
          // Find the node, given the ID.
          let node: MissionNode | undefined = this.mission.nodes.get(nodeID)

          // If the node is undefined, then reject
          // with a 404 error.
          if (node === undefined) {
            let error: AxiosError = new AxiosError('Node not found.')
            error.status = 404
            return reject(error)
          }

          // If the node is executable, then reject
          // with a 401 error.
          if (!node.openable) {
            let error: AxiosError = new AxiosError('Node is not openable.')
            error.status = 401
            return reject(error)
          }

          // Open the node.
          node.open()
        }
      },
    )
  }

  /**
   * Executes the given action on the corresponding node.
   * @param {actionID} string The ID of the action to be executed.
   * @returns {Promise<void>} A promise of the action being executed.
   */
  public async execute(actionID: string): Promise<void> {
    return new Promise<void>(
      (resolve: () => void, reject: (error: AxiosError) => void): void => {
        // If the context is react, then we need
        // to make a request to the server. The
        // server needs to handle the execution of
        // the action, not the client.
        if (context === 'react') {
          axios
            .post<void>(`${Game.API_ENDPOINT}/execute/`, { actionID })
            .then(resolve)
            .catch((error: AxiosError) => {
              console.error('Failed to execute action.')
              console.error(error)
              reject(error)
            })
        }
        // If the context is express, then we need
        // to execute the action here.
        else if (context === 'express') {
          // Find the action given the ID.
          let action: MissionNodeAction | undefined = this.actions.get(actionID)

          // If the action is undefined, then reject
          // with a 404 error.
          if (action === undefined) {
            let error: AxiosError = new AxiosError('Action not found.')
            error.status = 404
            return reject(error)
          }

          // If the action is not executable, then
          // reject with a 401 error.
          if (!action.node.executable) {
            let error: AxiosError = new AxiosError('Node is not executable.')
            error.status = 401
            return reject(error)
          }

          // If the node is not revealed, then
          // reject with a 401 error.
          if (action.node.revealed) {
            let error: AxiosError = new AxiosError('Node is not revealed.')
            error.status = 401
            return reject(error)
          }

          // Execute the action.
          action.execute(false, resolve, () => {
            reject(new AxiosError('Failed to execute action.'))
          })
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
    this.participants.push(participant)

    // Add game-specific listeners.
    this.addListeners(participant)
  }

  /**
   * Creates game-specific listeners for the given particpant.
   */
  private addListeners(participant: ClientConnection): void {
    // todo: add listeners
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
}

/**
 * Client instance for games. Handles client-side logic for games. Communicates with server to conduct game.
 */
export class GameClient extends Game<User> {
  /**
   * The server connection used to communicate with the server.
   */
  protected server: ServerConnection

  public constructor(
    gameID: string,
    mission: Mission,
    participants: Array<User>,
    server: ServerConnection,
  ) {
    super(gameID, mission, participants)
    this.server = server
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
            await axios.post<IGameJSON>(`${Game.API_ENDPOINT}/join/`, {
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
