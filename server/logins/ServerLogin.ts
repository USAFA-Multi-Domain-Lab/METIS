import type { Request } from 'express-serve-static-core'
import { ServerEmittedError } from 'metis/connect'
import type { TLoginJson } from 'metis/logins'
import { Session } from 'metis/sessions'
import type { ClientConnection } from '../connect'
import { SessionServer } from '../sessions/SessionServer'
import type { ServerUser } from '../users'
import { ServerWebSession } from './ServerWebSession'

/**
 * Express sessions are limited in what they can store. This class expands the functionality of logins in METIS.
 */
export class ServerLogin {
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
   * The ID of the METIS session the user is currently in, if any.
   * @note This is not the same as the session ID of the express web session.
   * @see {@link Session} class for more information.
   */
  private _metisSessionId: string | null
  /**
   * The ID of the METIS session the user is currently in, if any.
   * @note This is not the same as the session ID of the express session.
   * @see {@link Session} class for more information.
   */
  public get metisSessionId(): string | null {
    return this._metisSessionId
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
   * The (express) web session ID associated with the login.
   */
  private _webSessionId: Request['session']['id']
  /**
   * The (express) web session ID associated with the login.
   */
  public get webSessionId(): Request['session']['id'] {
    return this._webSessionId
  }

  /**
   * Whether the login is in a timeout.
   */
  public get inTimeout(): boolean {
    return this.timeoutEnd !== null && this.timeoutEnd > Date.now()
  }

  /**
   * @param user The user to log in.
   * @param webSessionId The (express) web session ID associated with the login.
   * @param options Options for the login.
   */
  public constructor(
    user: ServerUser,
    webSessionId: Request['session']['id'],
    options: TServerLoginOptions = {},
  ) {
    const { forceful = false } = options

    this._user = user
    this._webSessionId = webSessionId
    this._client = null
    this._metisSessionId = null
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

        // Force quit the previous METIS session, if any.
        if (conflictingLogin.metisSessionId) {
          SessionServer.quit(
            conflictingLogin.metisSessionId,
            conflictingLogin.userId,
          )
        }

        // Destroy the old login.
        conflictingLogin.destroy()
      } else {
        throw new Error('User is already logged in.')
      }
    }

    // Store the login in the registry if the user
    // isn't in a timeout.
    if (!this.inTimeout) {
      ServerLogin.registry.set(this.userId, this)
      // Register the login with the session store.
      ServerWebSession.registerLogin(this.webSessionId, this.userId)
    }
  }

  /**
   * Converts the login object to JSON to send to the client.
   * @returns The JSON representation of the login object.
   */
  public toJson(): TLoginJson {
    return {
      user: this.user.toExistingJson(),
      sessionId: this.metisSessionId,
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
   */
  public timeout(timeoutEnd: number): void {
    this._timeoutEnd = timeoutEnd
    ServerLogin.timeoutRegistry.set(this.userId, timeoutEnd)
  }

  /**
   * Handles when the user joins a METIS session.
   * @param metisSessionId The ID of the joined METIS session.
   * @see {@link Session} class for more information.
   */
  public onMetisSessionJoin(metisSessionId: string): void {
    this._metisSessionId = metisSessionId
  }

  /**
   * Handles when the user quits a METIS session.
   * @see {@link Session} class for more information.
   */
  public onMetisSessionQuit(): void {
    this._metisSessionId = null
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
   * Destroys the login information associated with the given user ID.
   * @param userId The ID of the user to log out.
   */
  public static destroy(userId: ServerUser['_id'] | undefined): void {
    let login = ServerLogin.get(userId)
    login?.destroy()
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
   * @param userId The ID of the user to set the timeout for.
   * @param timeoutEnd When the timeout ends.
   */
  public static timeout(
    userId: ServerUser['_id'] | undefined,
    timeoutEnd: number,
  ): void {
    let login = ServerLogin.get(userId)
    login?.timeout(timeoutEnd)
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
