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
  private _userId: ServerUser['username']

  /**
   * The ID of the user for the given session. This is used to retrieve the Session object from the registry.
   */
  public get userId(): ServerUser['username'] {
    return this._userId
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
    if (client !== null && client.session.userId !== this.userId) {
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
  private _gameId: string | null
  /**
   * The ID of the game the user is currently in, if any.
   */
  public get gameId(): string | null {
    return this._gameId
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
    return this.gameId !== null
  }

  /**
   * @param user The user associated with the session.
   */
  public constructor(user: ServerUser) {
    this._userId = user.username
    this._user = user
    this._client = null
    this._gameId = null
    this._destroyed = false

    // Throw an error is a session already
    // exists for the given user.
    if (MetisSession.registry.has(this.userId)) {
      throw new Error('A session already exists for the given user.')
    }

    // Store the session in the registry.
    MetisSession.registry.set(this.userId, this)
  }

  /**
   * Converts the session object to JSON to send to the client.
   * @returns {TMetisSessionJSON} The JSON representation of the session object.
   */
  public toJson(): TMetisSessionJSON {
    return {
      user: this.user.toJson(),
      gameId: this.gameId,
    }
  }

  /**
   * Destroys the session.
   */
  public destroy(): void {
    MetisSession.registry.delete(this.userId)
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
    userId: ServerUser['username'] | undefined,
  ): MetisSession | undefined {
    if (userId === undefined) {
      return undefined
    } else {
      return MetisSession.registry.get(userId)
    }
  }

  /**
   * Destroys the session associated with the given user ID.
   */
  public static destroy(userId: ServerUser['username'] | undefined): void {
    let session: MetisSession | undefined = MetisSession.get(userId)
    if (session !== undefined) {
      session.destroy()
    }
  }
}
