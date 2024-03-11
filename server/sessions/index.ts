import ClientConnection from 'metis/server/connect/clients'
import { TMetisSessionJSON } from 'metis/sessions'
import ServerUser from '../users'

/**
 * Express sessions are limited in what they can store. This class expands the functionality of sessions in METIS.
 */
export default class MetisSession {
  /**
   * The ID of the user for the given session. This is used to retrieve the Session object from the registry.
   */
  private _userID: ServerUser['userID']

  /**
   * The ID of the user for the given session. This is used to retrieve the Session object from the registry.
   */
  public get userID(): ServerUser['userID'] {
    return this._userID
  }

  /**
   * The client connection for this session, if any.
   */
  private _client: ClientConnection | null

  /**
   * The client connection for this session, if any.
   */
  public get client(): ClientConnection | null {
    return this._client
  }

  /**
   * The client connection for this session, if any.
   */
  public set client(client: ClientConnection | null) {
    if (client !== null && client.session.userID !== this.userID) {
      throw new Error(
        'Cannot set client to a client connection with a different user ID.',
      )
    }

    // Set client.
    this._client = client
  }

  /**
   * The user associated with the session.
   */
  private _user: ServerUser

  /**
   * The user associated with the session.
   */
  public get user(): ServerUser {
    return this._user
  }

  /**
   * The ID of the game the user is currently in, if any.
   */
  private _gameID: string | null
  /**
   * The ID of the game the user is currently in, if any.
   */
  public get gameID(): string | null {
    return this._gameID
  }

  /**
   * Whether the session has been destroyed.
   */
  private _destroyed: boolean

  /**
   * Whether the session has been destroyed.
   */
  public get destroyed(): boolean {
    return this._destroyed
  }

  /**
   * Whether the session has an associated connection.
   */
  public get hasClientConnection(): boolean {
    return this.client !== null
  }

  /**
   * Whether the user is in a game.
   */
  public get inGame(): boolean {
    return this.gameID !== null
  }

  /**
   * @param {ServerUser} user The user associated with the session.
   */
  public constructor(user: ServerUser) {
    this._userID = user.userID
    this._user = user
    this._client = null
    this._gameID = null
    this._destroyed = false

    // Throw an error is a session already
    // exists for the given user.
    if (MetisSession.registry.has(this.userID)) {
      throw new Error('A session already exists for the given user.')
    }

    // Store the session in the registry.
    MetisSession.registry.set(this.userID, this)
  }

  /**
   * Converts the session object to JSON to send to the client.
   * @returns {TMetisSessionJSON} The JSON representation of the session object.
   */
  public toJSON(): TMetisSessionJSON {
    return {
      user: this.user.toJson(),
      gameID: this.gameID,
    }
  }

  /**
   * Destroys the session.
   */
  public destroy(): void {
    MetisSession.registry.delete(this.userID)
    this._destroyed = true
  }

  /**
   * Handles when the user joins a game.
   * @param gameID The ID of the joined game.
   */
  public handleJoin(gameID: string): void {
    this._gameID = gameID
  }

  /**
   * Handles when the user quits a game.
   */
  public handleQuit(): void {
    this._gameID = null
  }

  /**
   * A registry of all sessions currently in use.
   */
  private static registry: Map<string, MetisSession> = new Map<
    string,
    MetisSession
  >()

  /**
   * @returns the session associated with the given user ID.
   */
  public static get(
    userID: ServerUser['userID'] | undefined,
  ): MetisSession | undefined {
    if (userID === undefined) {
      return undefined
    } else {
      return MetisSession.registry.get(userID)
    }
  }

  /**
   * Destroys the session associated with the given user ID.
   */
  public static destroy(userID: ServerUser['userID'] | undefined): void {
    let session: MetisSession | undefined = MetisSession.get(userID)
    if (session !== undefined) {
      session.destroy()
    }
  }
}
