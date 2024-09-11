import {
  TClientEvents,
  TClientMethod,
  TRequestEvents,
  TRequestMethod,
  TResponseEvent,
  TServerEvents,
  TServerMethod,
} from 'metis/connect/data'
import { ServerEmittedError } from 'metis/connect/errors'
import ServerLogin from 'metis/server/logins'
import { WebSocket } from 'ws'
import SessionServer from '../sessions'
import ServerUser from '../users'

/* -- classes -- */

/**
 * METIS web-socket-based, client connection.
 * @throws {Error} If the login passed already has a client.
 */
export default class ClientConnection {
  /**
   * The web socket connection itself.
   */
  protected socket: WebSocket
  /**
   * The login information associated with this client.
   */
  protected _login: ServerLogin
  /**
   * The login information associated with this client.
   */
  public get login(): ServerLogin {
    return this._login
  }

  /**
   * The user currently logged in.
   */
  public get user(): ServerUser {
    return this.login.user
  }

  /**
   * The userId for the user currently logged in.
   */
  public get userId(): string {
    return this.login.userId
  }

  /**
   * Storage for all listeners, in the order they get added.
   */
  protected listeners: [TClientMethod, TClientHandler<any>][] = []

  /**
   * @param {WebSocket} socket The web socket connection itself.
   * @param {IClientConnectionOptions} options Options for the server connection.
   */
  public constructor(
    socket: WebSocket,
    login: ServerLogin,
    options: IClientConnectionOptions = {},
  ) {
    this.socket = socket
    this._login = login

    let { disconnectExisting = false } = options

    // If the login information already contains a client,
    // handle the conflict.
    if (login.client !== null) {
      // If disconnectExisting was opted,
      // disconnect the existing client.
      if (disconnectExisting) {
        login.client.disconnect()
      }
      // Otherwise, reject new connection by
      // emmitting a duplicate client error
      // and disconnecting.
      else {
        this.emitError(
          new ServerEmittedError(ServerEmittedError.CODE_DUPLICATE_CLIENT),
        )
        this.disconnect()
        throw Error('User is already logged in.')
      }
    }

    login.client = this

    // Add event listeners passed in
    // options.
    if (options.on !== undefined) {
      for (let [key, value] of Object.entries(options.on) as any) {
        this.addEventListener(key, value)
      }
    }

    // Prepare the socket for use.
    this.prepareSocket()

    // Add default listeners.
    this.addDefaultListeners()
  }

  /**
   * Prepares the socket for use.
   */
  private prepareSocket(): void {
    // Add event listeners to the socket.
    this.socket.addEventListener('close', this.onClose)
    this.socket.addEventListener('message', this.onMessage)
  }

  /**
   * Emits an event to the client.
   * @param {TMethod} method The method of the event to emit.
   * @param {TPayload} payload The payload of the event to emit.
   */
  public emit<
    TMethod extends TServerMethod,
    TPayload extends Omit<TServerEvents[TMethod], 'method'>,
  >(method: TMethod, payload: TPayload): void {
    // Send payload.
    this.socket.send(JSON.stringify({ method, ...payload }))
  }

  /**
   * Emits an error to the client.
   * @param {ServerEmittedError} error The error to emit to the client.
   */
  public emitError(error: ServerEmittedError): void {
    let payload: TServerEvents['error'] = error.toJson()
    this.socket.send(JSON.stringify(payload))
  }

  /**
   * Adds a listener for a specific client event method.
   * @param {TClientMethod} method The event method that will be handled. The handler will only be called if the method matches what is sent by the client in a web socket message, except for 'close', and 'error' events, which are called upon their respective web socket events.
   * @param {TClientHandler<TServerEvent>} handler The handler that will be called upon the event being triggered.
   * @returns {ClientConnection} The client connection instance, allowing the chaining of class method calls.
   */
  public addEventListener<TMethod extends TClientMethod>(
    method: TMethod,
    handler: TClientHandler<TMethod>,
  ): ClientConnection {
    // Push the new listener to the array of listeners.
    this.listeners.push([method, handler])
    // Return this.
    return this
  }

  /**
   * Clears event listeners from the connection.
   * @param filter A list of handler types to remove. Any handler matching any type in the filter will be cleared.
   * If this is undefined, all handlers will be removed from the connection.
   * @returns The number of matching event listeners removed.
   */
  public clearEventListeners(filter?: TClientMethod[]): number {
    // Initialize removal count.
    let removalCount: number = 0

    // If no filter...
    if (filter === undefined) {
      // Get the number of event listeners currently
      // existing.
      removalCount = this.listeners.length

      // Reinitialize listeners.
      this.listeners = []
    } else {
      // Filter out listeners using the filter
      // passed.
      this.listeners = this.listeners.filter(([method]) => {
        if (filter.includes(method)) {
          removalCount++
          return false
        } else {
          return true
        }
      })
    }

    // Return final removal count.
    return removalCount
  }

  /**
   * Adds default listeners for the client connection.
   */
  protected addDefaultListeners(): void {
    // Add a `request-current-session` listener.
    this.addEventListener('request-current-session', (event) => {
      // Get the current session.
      let session = SessionServer.get(this.login.sessionId ?? undefined)
      // Create default data object.
      let data: TServerEvents['current-session']['data'] = {
        session: null,
        roleId: null,
      }

      // If there is a session, update the data object.
      if (session) {
        data.session = session.toJson({
          requester: session.getMemberByUserId(this.userId),
        })
        data.roleId = session.getRole(this.userId)?._id ?? null
      }

      // Emit the current session in response to the client.
      if (session !== undefined) {
        this.emit('current-session', {
          data,
          request: this.buildResponseReqData(event),
        })
      }
    })

    // Add a `request-join-session` listener.
    this.addEventListener('request-join-session', (event) => {
      // Get session.
      let session: SessionServer | undefined = SessionServer.get(
        event.data.sessionId,
      )

      // If session is undefined, emit session not found.
      if (session === undefined) {
        return this.emitError(
          new ServerEmittedError(ServerEmittedError.CODE_SESSION_NOT_FOUND, {
            request: this.buildResponseReqData(event),
          }),
        )
      }

      try {
        // Join the session.
        let member = session.join(this, event.data.roleId)
        // Return the session as JSON.
        this.emit('session-joined', {
          data: {
            session: session.toJson({ requester: member }),
            role: event.data.roleId,
          },
          request: this.buildResponseReqData(event),
        })
      } catch (code: any) {
        // Emit an error if thrown.
        this.emitError(
          new ServerEmittedError(code, {
            request: this.buildResponseReqData(event),
          }),
        )
      }
    })

    // Add a `request-quit-session` listener.
    this.addEventListener('request-quit-session', (event) => {
      // Get the session.
      let session = SessionServer.get(this.login.sessionId ?? undefined)

      // Quit the session, if defined.
      if (session !== undefined) {
        session.quit(this.userId)
      }

      // Return response.
      this.emit('session-quit', {
        data: {},
        request: this.buildResponseReqData(event),
      })
    })
  }

  /**
   * Disconnects from the server, closing the web socket connection.
   */
  protected disconnect(): void {
    this.socket.close()
  }

  /**
   * Builds fulfilled `request` property for response events.
   */
  public buildResponseReqData<
    TMethod extends TRequestMethod,
    TEvent extends TRequestEvents[TMethod],
  >(
    requestEvent: TEvent,
    options: TBuildResReqDataOptions = {},
  ): TResponseEvent<any, any, TEvent>['request'] {
    // Extract options.
    let { fulfilled = true } = options

    // Return the request data.
    return {
      event: requestEvent,
      requesterId: this.userId,
      fulfilled,
    }
  }

  /**
   * Handler for when the web socket connection is closed. Calls all "close" listeners stored in "listeners".
   * @param {WSCloseEvent} event The close event.
   */
  private onClose = (event: WSCloseEvent): void => {
    // Pre-create data object, since
    // it will not vary.
    let serverEvent: TServerEvents['connection-closed'] = {
      method: 'connection-closed',
      data: {},
    }

    // Loop though listeners.
    for (let [method, listener] of this.listeners) {
      // Call any "close" listeners.
      if (method === 'close') {
        listener(serverEvent)
      }
    }

    // Clear client from the login information.
    this.login.client = null
  }

  /**
   * Handler for when the web socket connection is opened. Calls all matching listeners stored in "listeners".
   * @param {WSCloseEvent} event The message event.
   */
  private onMessage = (event: WSMessageEvent): void => {
    // If the data passed is not a string,
    // throw an error.
    if (typeof event.data !== 'string') {
      this.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_INVALID_DATA, {
          message: 'The data passed was not a string.',
        }),
      )
      return
    }

    // Parse the data.
    let data = JSON.parse(event.data)

    // Call any listeners matching the method found in the
    // data.
    for (let [method, listener] of this.listeners) {
      if (data.method === method) {
        listener(data)
      }
    }
  }
}

/* -- types -- */

export type TClientHandler<TMethod extends TClientMethod> = (
  data: TClientEvents[TMethod],
) => void

/**
 * Represents options that can be passed when constructing a new client connection.
 */
export interface IClientConnectionOptions {
  on?: {
    [T in TClientMethod]?: TClientHandler<T>
  }
  /**
   * Whether to disconnect existing connections for the given login.
   * @WIP
   */
  disconnectExisting?: boolean
}

/**
 * Extracts event type from on the close event listener function.
 */
type WSCloseEvent = Parameters<
  NonNullable<typeof WebSocket.prototype.onclose>
>[0]
/**
 * Extracts event type from on the message event listener function.
 */
type WSMessageEvent = Parameters<
  NonNullable<typeof WebSocket.prototype.onmessage>
>[0]

/**
 * Options for `ClientConnection.buildFulfilledReqForRes`.
 */
type TBuildResReqDataOptions = {
  /**
   * Whether the request was fulfilled.
   * @default true
   */
  fulfilled?: boolean
}
