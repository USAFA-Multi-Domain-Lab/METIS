import { v4 as generateHash } from 'uuid'
import { TMetisSessionJSON, User } from '../src/modules/users'
import { Game } from '../src/modules/games'
import { WebSocket } from 'ws'
import ClientConnection from '../modules/client-connect'

/**
 * Express sessions are limited in what they can store. This class expands the functionality of sessions in METIS.
 */
export default class MetisSession {
  /**
   * The ID of the session. This is used to retrieve the Session object from the registry.
   */
  private _sessionID: string

  /**
   * The ID of the session. This is used to retrieve the Session object from the registry.
   */
  public get sessionID(): string {
    return this._sessionID
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
    if (client !== null && client.session.sessionID !== this.sessionID) {
      throw new Error(
        'Cannot set client to a client connection with a different session ID.',
      )
    }
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
   * A game that the user is currently playing.
   */
  private _game: Game | undefined

  /**
   * A game that the user is currently playing.
   */
  public get game(): Game | undefined {
    return this._game
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
   * @param {User} user The user associated with the session.
   */
  public constructor(user: User) {
    this._sessionID = generateHash()
    this._user = user
    this._client = null
    this._destroyed = false
    MetisSession.registry.set(this.sessionID, this)
  }

  public async joinGame(game: Game): Promise<void> {
    return game.join(this.user).then(() => {
      this._game = game
    })
  }

  public async quitGame() {
    if (this._game) {
      this._game = undefined
    }
  }

  /**
   * Destroys the session.
   */
  public destroy(): void {
    MetisSession.registry.delete(this.sessionID)
    this._destroyed = true
  }

  /**
   * Converts the session object to JSON to send to the client.
   * @returns {TMetisSessionJSON} The JSON representation of the session object.
   */
  public toJSON(): TMetisSessionJSON {
    return {
      user: this.user.toJSON(),
      inGame: this.game !== undefined,
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
   * @returns the session associated with the given session ID.
   */
  public static get(sessionID: string | undefined): MetisSession | undefined {
    if (sessionID === undefined) {
      return undefined
    } else {
      return MetisSession.registry.get(sessionID)
    }
  }

  /**
   * Destroys the session associated with the given session ID.
   */
  public static destroy(sessionID: string | undefined): void {
    let session: MetisSession | undefined = MetisSession.get(sessionID)
    if (session !== undefined) {
      session.destroy()
    }
  }
}
