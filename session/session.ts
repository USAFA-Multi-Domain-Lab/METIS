import { v4 as generateHash } from 'uuid'
import { IMetisSessionJSON, User } from '../src/modules/users'
import { Mission } from '../src/modules/missions'

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
   * A mission that the user is currently executing.
   */
  private _mission: Mission | undefined

  /**
   * A mission that the user is currently executing.
   */
  public get mission(): Mission | undefined {
    return this._mission
  }

  public constructor(user: User) {
    this._sessionID = generateHash()
    this._user = user
    MetisSession.registry.set(this.sessionID, this)
  }

  /**
   * Destroys the session.
   */
  public destroy(): void {
    MetisSession.registry.delete(this.sessionID)
  }

  /**
   * Converts the session object to JSON to send to the client.
   * @returns {IMetisSessionJSON} The JSON representation of the session object.
   */
  public toJSON(): IMetisSessionJSON {
    return {
      user: this.user.toJSON(),
      mission: this.mission ? this.mission.toJSON() : undefined,
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
    if (sessionID !== undefined) {
      MetisSession.registry.delete(sessionID)
    }
  }
}
