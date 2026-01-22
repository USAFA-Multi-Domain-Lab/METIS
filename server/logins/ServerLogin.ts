import type { ClientConnection } from '@server/connect/ClientConnection'
import { expressLogger } from '@server/logging'
import { MetisServer } from '@server/MetisServer'
import type { ServerUser } from '@server/users/ServerUser'
import { ServerEmittedError } from '@shared/connect/errors/ServerEmittedError'
import { type TLoginJson } from '@shared/logins'
import { MissionSession } from '@shared/sessions/MissionSession'
import type { Request } from 'express-serve-static-core'
import { SessionServer } from '../sessions/SessionServer'

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
   * The ID of the METIS mission session the user is currently in, if any.
   * @note This is not the same as the session ID of the express session.
   * @see {@link MissionSession} class for more information.
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
   * The time remaining in the timeout, in milliseconds. If zero,
   * the login is not in a timeout.
   */
  public get timeoutRemaining(): number {
    if (!this.timeoutEnd) {
      return 0
    }
    return Math.max(0, Math.floor(this.timeoutEnd - Date.now()))
  }

  /**
   * The time remaining in the timeout, in minutes. If zero,
   * the login is not in a timeout.
   * @note This is rounded up to the nearest minute.
   */
  public get timeoutMinutesRemaining(): number {
    return Math.ceil(this.timeoutRemaining / 60000)
  }

  /**
   * Whether this login is a duplicate login that conflicts with an existing login.
   */
  private _isDuplicate: boolean
  /**
   * Whether this login is a duplicate login that conflicts with an existing login.
   */
  public get isDuplicate(): boolean {
    if (this.destroyed) return false
    return this._isDuplicate
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
    this._timeoutEnd = ServerLogin.getTimeoutEndByUserId(this.userId)
    this._isDuplicate = false

    // Check for duplicate logins.
    let duplicateLogin = ServerLogin.getByUserId(this.userId)

    // Handle duplicate login.
    if (duplicateLogin) {
      this._isDuplicate = true

      if (!forceful) return

      // If the duplicate login has a client,
      // emit an error to that client that the
      // connection is switching.
      if (duplicateLogin.client) {
        duplicateLogin.client.emitError(
          new ServerEmittedError(ServerEmittedError.CODE_SWITCHED_CLIENT),
        )
      }

      duplicateLogin.destroy()
    }

    // Store the login in the registry if the user
    // isn't in a timeout.
    if (!this.inTimeout) {
      ServerLogin.registryByUserId.set(this.userId, this)
      ServerLogin.registryByWebSessionId.set(this.webSessionId, this)
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
    if (this.destroyed) return

    // Remove from registries immediately so subsequent requests
    // see the user as logged out, even if session-store cleanup
    // completes asynchronously.
    ServerLogin.registryByUserId.delete(this.userId)
    ServerLogin.registryByWebSessionId.delete(this.webSessionId)
    ServerLogin.timeoutRegistryByWebSessionId.delete(this.webSessionId)

    // Quit METIS session if in one.
    if (this.metisSessionId) {
      SessionServer.quit(this.metisSessionId, this.userId)
    }

    // Disconnect the client's websocket connection if it exists.
    this.client?.disconnect()

    this._destroyed = true

    MetisServer.sessionStore.destroy(this.webSessionId, (error) => {
      if (error) {
        expressLogger.error(
          'Session store destroy warning:',
          error.message || error,
        )
      }
    })
  }

  /**
   * Sets the timeout information for the user logged in.
   * @param timeoutEnd When the timeout ends.
   */
  public timeout(timeoutEnd: number): void {
    this._timeoutEnd = timeoutEnd
    ServerLogin.timeoutRegistryByUserId.set(this.userId, timeoutEnd)
    ServerLogin.timeoutRegistryByWebSessionId.set(this.webSessionId, timeoutEnd)
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
   * A registry of all logins currently in use by user ID.
   */
  private static registryByUserId: Map<ServerUser['_id'], ServerLogin> =
    new Map<ServerUser['_id'], ServerLogin>()

  /**
   * A registry of all logins currently in use by web session ID.
   */
  private static registryByWebSessionId: Map<
    Request['session']['id'],
    ServerLogin
  > = new Map<Request['session']['id'], ServerLogin>()

  /**
   * A registry of all logins that are in timeout by user ID.
   */
  private static timeoutRegistryByUserId: Map<ServerUser['_id'], number> =
    new Map<ServerUser['_id'], number>()

  /**
   * A registry of all logins that are in timeout by web session ID.
   */
  private static timeoutRegistryByWebSessionId: Map<
    Request['session']['id'],
    number
  > = new Map<Request['session']['id'], number>()

  /**
   * @returns the login information associated with the given user ID.
   */
  public static getByUserId(
    userId: ServerUser['_id'] | undefined,
  ): ServerLogin | undefined {
    if (!userId) return undefined
    return ServerLogin.registryByUserId.get(userId)
  }

  /**
   * @returns the login information associated with the given web session ID.
   */
  public static getByWebSessionId(
    webSessionId: Request['session']['id'] | undefined,
  ): ServerLogin | undefined {
    if (!webSessionId) return undefined
    return ServerLogin.registryByWebSessionId.get(webSessionId)
  }

  /**
   * Destroys the login information associated with the given user ID.
   */
  public static destroyByUserId(userId: ServerUser['_id']): void {
    let login = ServerLogin.getByUserId(userId)
    login?.destroy()
  }

  /**
   * Destroys the login information associated with the given web session ID.
   */
  public static destroyByWebSessionId(
    webSessionId: Request['session']['id'],
  ): void {
    let login = ServerLogin.getByWebSessionId(webSessionId)
    login?.destroy()
  }

  /**
   * @returns the login timeout end time associated with the given user ID.
   */
  public static getTimeoutEndByUserId(
    userId: ServerUser['_id'] | undefined,
  ): number | null {
    if (!userId) return null
    const { timeoutRegistryByUserId } = ServerLogin
    return timeoutRegistryByUserId.get(userId) ?? null
  }

  /**
   * @returns the login timeout end time associated with the given web session ID.
   */
  public static getTimeoutEndByWebSessionId(
    webSessionId: Request['session']['id'] | undefined,
  ): number | null {
    if (!webSessionId) return null
    const { timeoutRegistryByWebSessionId } = ServerLogin
    return timeoutRegistryByWebSessionId.get(webSessionId) ?? null
  }

  /**
   * Sets a timeout for the user with the given user ID.
   * @param userId The ID of the user to set the timeout for.
   * @param timeoutEnd When the timeout ends.
   */
  public static timeoutByUserId(
    userId: ServerUser['_id'],
    timeoutEnd: number,
  ): void {
    if (!userId) return
    let login = ServerLogin.getByUserId(userId)
    login?.timeout(timeoutEnd)
  }

  /**
   * Sets a timeout for the user with the given web session ID.
   * @param webSessionId The (express) web session ID associated with the login.
   * @param timeoutEnd When the timeout ends.
   */
  public static timeoutByWebSessionId(
    webSessionId: Request['session']['id'],
    timeoutEnd: number,
  ): void {
    let login = ServerLogin.getByWebSessionId(webSessionId)
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
