import express from 'express'
import { ServerEmittedError } from 'metis/connect/errors'
import ServerLogin from 'metis/server/logins'
import { Socket, Server as SocketIoServer } from 'socket.io'
import MetisServer from '../index'
import SessionServer from '../sessions'
import ClientConnection from './clients'
import authMiddleware from './middleware/auth'
const createSocketIoServer = require('socket.io')

/* -- CLASSES -- */

/**
 * Represents a web socket server managed by a `MetisServer`
 * instance.
 */
export default class MetisWsServer {
  /**
   * The METIS server instance.
   */
  public readonly metis: MetisServer

  /**
   * The socket.io server instance.
   */
  public readonly socketIo: SocketIoServer

  /**
   *
   * @param metis The METIS server instance.
   */
  public constructor(metis: MetisServer) {
    this.metis = metis
    this.socketIo = createSocketIoServer(metis.httpServer)
  }

  /**
   * Initializes the web socket server.
   */
  public initialize(): void {
    // Gather details.
    const { metis } = this

    // Add middleware.
    this.useOnEngine((_, request, response, next) =>
      metis.sessionMiddleware(request, response, next),
    )
    this.use(authMiddleware)

    // Add event listeners.
    this.addEventListeners()
  }

  /**
   * Adds a middleware function to the web socket server.
   * @note This will get called after the low-level
   * connection is established, but before the connection
   * is upgraded to WebSocket.
   */
  public use(middleware: TMetisWsMiddleware): void {
    // Register the middleware in Socket.IO.
    this.socketIo.use((socket, next) =>
      middleware(this.metis, socket, (error) => {
        // Convert server emitted errors to regular errors.
        if (error instanceof ServerEmittedError) {
          error = new Error(JSON.stringify(error.toJson()))
        }
        next(error)
      }),
    )
  }

  /**
   * Adds a low-level middleware function to the SocketIO
   * engine.
   * @note This middleware gets called before the middleware
   * added with the `use` method.
   * @note This middleware is called before the handshake
   * has been made.
   */
  public useOnEngine(middleware: TMetisWsEngineMiddleware): void {
    // Register the middleware in Socket.IO.
    this.socketIo.engine.use((request: any, response: any, next: any) =>
      middleware(this.metis, request, response, next),
    )
  }

  /**
   * Routes web socket events to the appropriate handlers.
   */
  private addEventListeners(): void {
    this.socketIo.on('connection', (socket) => {
      const { 'disconnect-existing': disconnectExisting } =
        socket.request.headers
      const { session } = socket.request

      let login: ServerLogin | undefined = ServerLogin.get(session.userId)

      // If no login information is found,
      // close the connection.
      if (login === undefined) {
        ClientConnection.emitError(
          new ServerEmittedError(ServerEmittedError.CODE_UNAUTHENTICATED),
          socket,
        )
        return socket.disconnect()
      }

      // If 'disconnect-existing' is set to true,
      // and the login already contains a client,
      // close the existing connection.
      if (disconnectExisting && login.client) {
        login.client.disconnect(
          new ServerEmittedError(ServerEmittedError.CODE_SWITCHED_CLIENT),
        )
      }
      // Create a client connection object
      // with the socket and login.
      let connection = new ClientConnection(socket, this.metis, login, {})

      // If the login information indicates that the user is
      // currently in a session, find the session and update
      // the connection for that participant.
      if (login.metisSessionId !== null) {
        // Get the session.
        let session = SessionServer.get(login.metisSessionId)

        // If the session exists, update the connection.
        if (session !== undefined) {
          session.handleConnectionChange(connection)
        }
      }
    })
  }
}

/* -- TYPES -- */

/**
 * A METIS web socket middleware function.
 * @note This is called at a low-level, before the
 * handshake has been made.
 */
export type TMetisWsEngineMiddleware = (
  metis: MetisServer,
  request: express.Request,
  response: express.Response,
  next: express.NextFunction,
) => void

/**
 * A METIS web socket middleware function.
 * @note This is called after the handshake has been
 * made but before the connection is upgraded to WebSocket.
 * @param server The METIS server instance.
 * @param socket The socket.io socket instance.
 * @param next The callback to call when the middleware is done.
 * An error can be passed to this function to abort the connection.
 */
export type TMetisWsMiddleware = (
  server: MetisServer,
  socket: Socket,
  next: (error?: ServerEmittedError | Error) => void,
) => void
