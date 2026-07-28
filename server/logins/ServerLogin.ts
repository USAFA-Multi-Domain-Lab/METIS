import type { ClientConnection } from '@server/connect/ClientConnection'
import { expressLogger } from '@server/logging'
import { MetisServer } from '@server/MetisServer'
import type { ServerUser } from '@server/users/ServerUser'
import { ServerEmittedError } from '@shared/connect/errors/ServerEmittedError'
import { type TLoginJson } from '@shared/logins'
import { MissionSession } from '@shared/sessions/MissionSession'
import type { Request } from 'express-serve-static-core'
import { Socket } from 'socket.io'
import { SessionServer } from '../sessions/SessionServer'

/**
 * Express sessions are limited in what they can store. This class expands the functionality of user logins in METIS.
 * @note This class is meant to work in conjunction with {@link ServerUser} because user's shouldn't be able to use
 * METIS without logging in first.
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
  public set client(client: ClientConnection | null) {
    if (client !== null && client.login.userId !== this.userId) {
      throw new Error(
        'Cannot set client to a client connection with a different user ID.',
      )
    }

    // Unregister the connection being replaced, since this login is no
    // longer reachable through its socket.
    if (this._client) {
      ServerLogin.socketRegistry.delete(this._client.socketId)
    }

    // Register in socket registry.
    if (client) {
      ServerLogin.socketRegistry.set(client.socketId, this)
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
   * The express session ID associated with the login.
   */
  private _expressSessionId: Request['session']['id']
  /**
   * The express session ID associated with the login.
   */
  public get expressSessionId(): Request['session']['id'] {
    return this._expressSessionId
  }

  /**
   * @param user The user to log in.
   * @param expressRequest The express request associated with the attempted login.
   * @note Creating a login takes over from any login that conflicts with it,
   * ending that one. Call {@link ServerLogin.findConflict} beforehand to ask
   * whether there is a conflict without ending anything.
   */
  public constructor(user: ServerUser, expressRequest: Request) {
    this._user = user
    this._expressSessionId = expressRequest.sessionID
    this._client = null
    this._metisSessionId = null
    this._destroyed = false

    let duplicateLogin = ServerLogin.findConflict(user, expressRequest)

    if (duplicateLogin) {
      // If the duplicate login has a client,
      // emit an error to that client that the
      // connection is switching.
      if (duplicateLogin.client) {
        duplicateLogin.client.emitError(
          new ServerEmittedError(ServerEmittedError.CODE_SWITCHED_CLIENT),
        )
      }

      // The duplicate may be logged in on the same express session this login
      // is being made from. That session carries over instead of being torn
      // down, which would leave the request that is logging in without one.
      let keepExpressSession =
        duplicateLogin.expressSessionId === this.expressSessionId

      // When the same user is logging back in on that session, they are only
      // swapping one login for another and stay in whatever METIS session they
      // are still part of. A session that has since ended is left behind, so a
      // login never claims a session the session server no longer has.
      let { metisSessionId } = duplicateLogin
      let keepMetisSession =
        keepExpressSession &&
        duplicateLogin.userId === this.userId &&
        metisSessionId !== null &&
        SessionServer.get(metisSessionId) !== undefined

      if (keepMetisSession) {
        this._metisSessionId = metisSessionId
      }

      duplicateLogin.destroy({ keepExpressSession, keepMetisSession })
    }

    // Register the login.
    ServerLogin.userIdRegistry.set(this.userId, this)
    ServerLogin.expressRegistry.set(this.expressSessionId, this)
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
   * @param options Options for destroying the login.
   */
  public destroy(options: TServerLoginDestroyOptions = {}): void {
    const { keepExpressSession = false, keepMetisSession = false } = options

    if (this.destroyed) return

    // Remove from user ID registry.
    ServerLogin.userIdRegistry.delete(this.userId)

    // Remove from express session ID registry.
    ServerLogin.expressRegistry.delete(this.expressSessionId)

    // Remove from METIS session registry, unless the user is staying in it
    // and only their login is being swapped out.
    if (this.metisSessionId && !keepMetisSession) {
      SessionServer.quit(this.metisSessionId, this.userId)
    }

    // Handle the client connection.
    if (this.client) {
      ServerLogin.socketRegistry.delete(this.client.socketId)
      this.client.disconnect()
    }

    // Mark as destroyed.
    this._destroyed = true

    // Destroy the express session, unless it is being carried over to
    // another login and still has to work.
    if (!keepExpressSession) {
      MetisServer.sessionStore.destroy(this.expressSessionId, (error) => {
        if (error) {
          expressLogger.error(
            'Session store destroy warning:',
            error.message || error,
          )
        }
      })
    }
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
   * Handles when the user leaves a METIS session.
   * @see {@link Session} class for more information.
   */
  public onMetisSessionLeave(): void {
    this._metisSessionId = null
  }

  /**
   * A registry of all logins currently in use by user ID.
   */
  protected static userIdRegistry: Map<ServerUser['_id'], ServerLogin> =
    new Map<ServerUser['_id'], ServerLogin>()

  /**
   * A registry of all logins currently in use by express session ID.
   */
  protected static expressRegistry: Map<Request['session']['id'], ServerLogin> =
    new Map<Request['session']['id'], ServerLogin>()

  /**
   * A registry of all logins currently in use by socket.io ID.
   */
  protected static socketRegistry: Map<Socket['id'], ServerLogin> = new Map<
    Socket['id'],
    ServerLogin
  >()

  /**
   * Finds the login that logging the given user in would conflict with,
   * without changing anything.
   * @param user The user attempting to log in.
   * @param expressRequest The express request the login is being attempted
   * from.
   * @returns The conflicting login, if there is one. This is either an
   * existing login for the same user, or the login already held by the
   * session the attempt is coming from.
   */
  public static findConflict(
    user: ServerUser,
    expressRequest: Request,
  ): ServerLogin | undefined {
    return (
      ServerLogin.userIdRegistry.get(user._id) ??
      ServerLogin.get(expressRequest)
    )
  }

  /**
   * @returns the login information associated with the express request.
   */
  private static getByExpressRequest(
    expressRequest: Request,
  ): ServerLogin | undefined {
    const { userId } = expressRequest.session

    // Prefer the login for the user the session says it is logged in as.
    if (userId) {
      let login = ServerLogin.userIdRegistry.get(userId)

      if (login) return login
    }

    // Otherwise fall back to a login registered for this session, which still
    // finds the login when the session names a user who no longer has one.
    let expressSessionId = expressRequest.sessionID
    return ServerLogin.expressRegistry.get(expressSessionId)
  }

  /**
   * @returns the login information associated with the socket request.
   */
  private static getBySocket(socket: Socket): ServerLogin | undefined {
    const { userId } = socket.request.session

    if (userId) {
      return ServerLogin.userIdRegistry.get(userId)
    }

    const { id: socketId } = socket
    return ServerLogin.socketRegistry.get(socketId)
  }

  /**
   * @param by The {@link ServerUser._id|UserId}, {@link Request}, or {@link Socket} to retrieve the login information by.
   */
  public static get(
    by: ServerUser['_id'] | Request | Socket,
  ): ServerLogin | undefined {
    if (typeof by === 'string') {
      return ServerLogin.userIdRegistry.get(by)
    } else if (by instanceof Socket) {
      return ServerLogin.getBySocket(by)
    } else {
      return ServerLogin.getByExpressRequest(by)
    }
  }

  /**
   * @param by The {@link ServerUser._id|UserId}, {@link Request}, or {@link Socket} used to destroy the login information by.
   * @see {@link ServerLogin.destroy}
   */
  public static destroy(by: ServerUser['_id'] | Request | Socket): void {
    let login = ServerLogin.get(by)
    login?.destroy()
  }
}

/* -- TYPES -- */

/**
 * Options for {@link ServerLogin.destroy}.
 */
export type TServerLoginDestroyOptions = {
  /**
   * Whether to leave the express session in the session store rather than
   * removing it.
   * @note Used when the login being destroyed is on the same express session
   * as the login replacing it, since removing that session would leave the
   * request that is logging in without one.
   * @default false
   */
  keepExpressSession?: boolean
  /**
   * Whether to leave the user in their METIS session rather than quitting it
   * on their behalf.
   * @note Used when the same user is logging back in on the same express
   * session, since they are staying where they are and only their login is
   * being replaced. The login replacing it takes over the METIS session ID so
   * that their next connection is reattached to the session.
   * @default false
   */
  keepMetisSession?: boolean
}

