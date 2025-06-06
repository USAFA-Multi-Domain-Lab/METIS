import { Request } from 'express-serve-static-core'
import { ServerEmittedError } from 'metis/connect/errors'
import { TLoginJson } from 'metis/logins'
import ClientConnection from 'metis/server/connect/clients'
import SessionServer from '../sessions'
import ServerUser from '../users'

/**
 * Express sessions are limited in what they can store. This class expands the functionality of logins in METIS.
 */
export default class ServerLogin {
  /**
   * The ID of the user currently logged in.
   * This is used to retrieve the Login object from the registry.
   */
  public get userId(): ServerUser['_id'] {
    return this.user._id
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
   * The ID of the session the user is currently in, if any.
   */
  private _sessionId: string | null
  /**
   * The ID of the session the user is currently in, if any.
   */
  public get sessionId(): string | null {
    return this._sessionId
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
   * Whether the user is in a session.
   */
  public get inSession(): boolean {
    return this.sessionId !== null
  }

  /**
   * When the login timeout ends.
   */
  private _timeoutEnd: number | null
  /**
   * When the login timeout ends.
   */
  public get timeoutEnd(): number | null {
    return this._timeoutEnd
  }

  /**
   * Whether the login is in a timeout.
   */
  public get inTimeout(): boolean {
    return this.timeoutEnd !== null && this.timeoutEnd > Date.now()
  }

  /**
   * @param user The user to log in.
   */
  public constructor(user: ServerUser, options: TServerLoginOptions = {}) {
    const { forceful = false } = options

    this._user = user
    this._client = null
    this._sessionId = null
    this._destroyed = false
    this._timeoutEnd = ServerLogin.getTimeoutEnd(this.userId) ?? null

    // Get any current login registered, conflicting
    // with the new login.
    let conflictingLogin: ServerLogin | undefined = ServerLogin.registry.get(
      this.userId,
    )

    // Handle duplicate login.
    if (conflictingLogin) {
      // If the login is forceful, force a log out
      // of the conflicting client.
      if (forceful) {
        // If the conflicting login has a client,
        // emit an error to that client that the
        // connection is switching.
        if (conflictingLogin.client) {
          conflictingLogin.client.emitError(
            new ServerEmittedError(ServerEmittedError.CODE_SWITCHED_CLIENT),
          )
        }
        // Destroy the login.
        this.destroy()
      } else {
        throw new Error('User is already logged in.')
      }
    }

    // Store the login in the registry if the user
    // isn't in a timeout.
    if (!this.inTimeout) {
      ServerLogin.registry.set(this.userId, this)
    }
  }

  /**
   * Converts the login object to JSON to send to the client.
   * @returns The JSON representation of the login object.
   */
  public toJson(): TLoginJson {
    return {
      user: this.user.toExistingJson(),
      sessionId: this.sessionId,
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
   * Sets the timeout information for the user logged in.
   * @param timeoutEnd When the timeout ends.
   * @note This will also destroy the login information to
   * ensure that the user is logged out.
   */
  public timeout(timeoutEnd: number): void {
    this._timeoutEnd = timeoutEnd
    ServerLogin.timeoutRegistry.set(this.userId, timeoutEnd)
    this.destroy()
  }

  /**
   * Handles when the user joins a session.
   * @param sessionId The ID of the joined session.
   */
  public handleJoin(sessionId: string): void {
    this._sessionId = sessionId
  }

  /**
   * Handles when the user quits a session.
   */
  public handleQuit(): void {
    this._sessionId = null
  }

  /**
   * Quits the session the user is in.
   */
  public quitSession(): void {
    let session = SessionServer.get(this.sessionId ?? undefined)
    session?.quit(this.userId)
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
    userId: ServerUser['_id'] | undefined,
  ): ServerLogin | undefined {
    if (userId === undefined) {
      return undefined
    } else {
      return ServerLogin.registry.get(userId)
    }
  }

  /**
   * Destroys the login information for the user associated with the current web session.
   * @param session The current web session.
   */
  public static async destroy(session: Request['session']): Promise<void> {
    return new Promise((resolve, reject) => {
      let login = ServerLogin.get(session.userId)
      // Quit the METIS session, if necessary.
      if (login?.inSession) login.quitSession()
      // Destroy the login information associated
      // with METIS and stored in memory.
      login?.destroy()
      // Destroy the express session.
      session.destroy((error) => {
        if (error) return reject(error)
        resolve()
      })
    })
  }

  /**
   * A registry of all logins that are in timeout.
   */
  private static timeoutRegistry: Map<string, number> = new Map<
    string,
    number
  >()

  /**
   * @returns the login timeout end time associated with the given user ID.
   */
  public static getTimeoutEnd(
    userId: ServerUser['_id'] | undefined,
  ): number | undefined {
    if (userId === undefined) {
      return undefined
    } else {
      return ServerLogin.timeoutRegistry.get(userId)
    }
  }

  /**
   * Sets a timeout for the user in the current web session.
   * @param session The current web session.
   * @param timeoutEnd When the timeout ends.
   * @note This will also destroy the login information to
   * ensure that the user is logged out.
   */
  public static async timeout(
    session: Request['session'],
    timeoutEnd: number,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let login = ServerLogin.get(session.userId)
      // Quit the METIS session, if necessary.
      if (login?.inSession) login.quitSession()
      // Set the timeout for the login.
      // *** Note: This also destroys the login
      // *** information associated with METIS
      // *** and stored in memory.
      login?.timeout(timeoutEnd)
      // Destroy the express session.
      session.destroy((error) => {
        if (error) return reject(error)
        resolve()
      })
    })
  }
}

/* -- TYPES -- */

/**
 * Options for `ServerLogin` constructor.
 */
export type TServerLoginOptions = {
  /**
   * Whether to force logout any other client logged in
   * with the same user.
   * @default false
   */
  forceful?: boolean
}
