import { TLoginJson } from 'metis/logins'
import ClientConnection from 'metis/server/connect/clients'
import ServerUser from '../users'

/**
 * Express sessions are limited in what they can store. This class expands the functionality of logins in METIS.
 */
export default class ServerLogin {
  /**
   * The ID of the user currently logged in.
   * This is used to retrieve the Login object from the registry.
   */
  private _userId: ServerUser['username']

  /**
   * The ID of the user currently logged in.
   * This is used to retrieve the Login object from the registry.
   */
  public get userId(): ServerUser['username'] {
    return this._userId
  }

  /**
   * The client connection for the user currently logged in, if any.
   */
  private _client: ClientConnection | null

  /**
   * The client connection for the user currently logged in, if any.
   */
  public get client(): ClientConnection | null {
    return this._client
  }

  /**
   * The client connection for the user currently logged in, if any.
   */
  public set client(client: ClientConnection | null) {
    if (client !== null && client.login.userId !== this.userId) {
      throw new Error(
        'Cannot set client to a client connection with a different user ID.',
      )
    }

    // Set client.
    this._client = client
  }

  /**
   * The user currently logged in.
   */
  private _user: ServerUser

  /**
   * The user currently logged in.
   */
  public get user(): ServerUser {
    return this._user
  }

  /**
   * The ID of the game the user is currently in, if any.
   */
  private _gameId: string | null
  /**
   * The ID of the game the user is currently in, if any.
   */
  public get gameId(): string | null {
    return this._gameId
  }

  /**
   * Whether the login has been destroyed.
   */
  private _destroyed: boolean

  /**
   * Whether the login has been destroyed.
   */
  public get destroyed(): boolean {
    return this._destroyed
  }

  /**
   * Whether the login has an associated connection.
   */
  public get hasClientConnection(): boolean {
    return this.client !== null
  }

  /**
   * Whether the user is in a game.
   */
  public get inGame(): boolean {
    return this.gameId !== null
  }

  /**
   * @param user The user to log in.
   */
  public constructor(user: ServerUser) {
    this._userId = user.username
    this._user = user
    this._client = null
    this._gameId = null
    this._destroyed = false

    // Throw an error if a user is already logged in.
    if (ServerLogin.registry.has(this.userId)) {
      throw new Error('User is already logged in.')
    }

    // Store the login in the registry.
    ServerLogin.registry.set(this.userId, this)
  }

  /**
   * Converts the login object to JSON to send to the client.
   * @returns {TLoginJson} The JSON representation of the login object.
   */
  public toJson(): TLoginJson {
    return {
      user: this.user.toJson(),
      gameId: this.gameId,
    }
  }

  /**
   * Destroys the login information.
   */
  public destroy(): void {
    ServerLogin.registry.delete(this.userId)
    this._destroyed = true
  }

  /**
   * Handles when the user joins a game.
   * @param gameId The ID of the joined game.
   */
  public handleJoin(gameId: string): void {
    this._gameId = gameId
  }

  /**
   * Handles when the user quits a game.
   */
  public handleQuit(): void {
    this._gameId = null
  }

  /**
   * A registry of all logins currently in use.
   */
  private static registry: Map<string, ServerLogin> = new Map<
    string,
    ServerLogin
  >()

  /**
   * @returns the login information associated with the given user ID.
   */
  public static get(
    userId: ServerUser['username'] | undefined,
  ): ServerLogin | undefined {
    if (userId === undefined) {
      return undefined
    } else {
      return ServerLogin.registry.get(userId)
    }
  }

  /**
   * Destroys the login information associated with the given user ID.
   */
  public static destroy(userId: ServerUser['username'] | undefined): void {
    let login: ServerLogin | undefined = ServerLogin.get(userId)
    if (login !== undefined) {
      login.destroy()
    }
  }
}
