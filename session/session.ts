import { TMetisSessionJSON, User } from '../src/modules/users'
import { Game } from '../src/modules/games'
import ClientConnection from '../src/modules/connect/client-connect'
import MissionModel from 'database/models/model-mission'
import { databaseLogger } from 'modules/logging'

/**
 * Express sessions are limited in what they can store. This class expands the functionality of sessions in METIS.
 */
export default class MetisSession {
  /**
   * The ID of the user for the given session. This is used to retrieve the Session object from the registry.
   */
  private _userID: string

  /**
   * The ID of the user for the given session. This is used to retrieve the Session object from the registry.
   */
  public get userID(): string {
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
  private _user: User

  /**
   * The user associated with the session.
   */
  public get user(): User {
    return this._user
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
    return true
  }

  /**
   * @param {User} user The user associated with the session.
   */
  public constructor(user: User) {
    this._userID = user.userID
    this._user = user
    this._client = null
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
   * Destroys the session.
   */
  public destroy(): void {
    MetisSession.registry.delete(this.userID)
    this._destroyed = true
  }

  /**
   * Converts the session object to JSON to send to the client.
   * @returns {TMetisSessionJSON} The JSON representation of the session object.
   */
  public toJSON(): TMetisSessionJSON {
    return {
      user: this.user.toJSON(),
      inGame: false,
    }
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
  public static get(userID: string | undefined): MetisSession | undefined {
    if (userID === undefined) {
      return undefined
    } else {
      return MetisSession.registry.get(userID)
    }
  }

  /**
   * Destroys the session associated with the given user ID.
   */
  public static destroy(userID: string | undefined): void {
    let session: MetisSession | undefined = MetisSession.get(userID)
    if (session !== undefined) {
      session.destroy()
    }
  }
}
