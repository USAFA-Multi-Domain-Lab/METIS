import {
  TClientEvent,
  TClientEvents,
  TClientMethod,
  TRequestEvents,
  TRequestMethod,
  TRequestOfResponse,
  TResponseEvent,
  TServerEvents,
  TServerMethod,
} from 'metis/connect/data'
import { ServerEmittedError } from 'metis/connect/errors'
import ServerLogin from 'metis/server/logins'
import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible'
import { Socket } from 'socket.io'
import MetisServer from '../index'
import SessionServer from '../sessions'
import ServerUser from '../users'
import { clientEventSchemas, looseEventSchema } from './middleware/validate'

/* -- classes -- */

/**
 * METIS web-socket-based, client connection.
 * @throws If the login passed already has a client.
 */
export default class ClientConnection {
  /**
   * The web socket connection itself.
   */
  protected socket: Socket

  /**
   * The METIS server instance.
   */
  protected metis: MetisServer

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
   * The rate limiter for the client.
   */
  protected limiter: RateLimiterMemory

  /**
   * @param socket The web socket connection itself.
   * @param login The client login
   */
  public constructor(
    socket: Socket,
    metis: MetisServer,
    login: ServerLogin,
    options: IClientConnectionOptions,
  ) {
    this.socket = socket
    this.metis = metis
    this._login = login
    login.client = this

    // Add event listeners passed in
    // options.
    if (options.on !== undefined) {
      for (let [key, value] of Object.entries(options.on) as any) {
        this.addEventListener(key, value)
      }
    }

    // Create rate limiter.
    this.limiter = new RateLimiterMemory({
      points: metis.wsRateLimit,
      duration: metis.wsRateLimitDuration,
    })

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
    this.socket.on('disconnect', this.onClose)
    this.socket.on('message', this.onMessage)
  }

  /**
   * Emits an event to the client.
   * @param method The method of the event to emit.
   * @param payload The payload of the event to emit.
   */
  public emit<
    TMethod extends TServerMethod,
    TPayload extends Omit<TServerEvents[TMethod], 'method'>,
  >(method: TMethod, payload: TPayload): void {
    ClientConnection.emit(method, payload, this.socket)
  }

  /**
   * Emits an error to the client.
   * @param error The error to emit to the client.
   */
  public emitError(error: ServerEmittedError): void {
    ClientConnection.emitError(error, this.socket)
  }

  /**
   * Adds a listener for a specific client event method.
   * @param method The event method that will be handled. The handler will only be called if the method matches what is sent by the client in a web socket message, except for 'close', and 'error' events, which are called upon their respective web socket events.
   * @param handler The handler that will be called upon the event being triggered.
   * @returns The client connection instance, allowing the chaining of class method calls.
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
      let session = SessionServer.get(this.login.sessionId ?? undefined)
      let requester = session?.getMemberByUserId(this.userId)

      // Handle missing requester or session.
      if (!requester) {
        this.emitError(
          new ServerEmittedError(ServerEmittedError.CODE_MEMBER_NOT_FOUND, {
            request: this.buildResponseReqData(event),
          }),
        )
        return
      }
      if (!session) {
        this.emitError(
          new ServerEmittedError(
            ServerEmittedError.CODE_SESSION_CONFLICTING_STATE,
            {
              request: this.buildResponseReqData(event),
            },
          ),
        )
        return
      }

      // Prepare payload and send response.
      let data: TServerEvents['current-session']['data'] = {
        session: session.toJson({
          requester,
        }),
        memberId: requester._id,
      }
      this.emit('current-session', {
        data,
        request: this.buildResponseReqData(event),
      })
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
        let member = session.join(this)
        // Return the session as JSON.
        this.emit('session-joined', {
          data: {
            session: session.toJson({ requester: member }),
            memberId: member._id,
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
  public disconnect(reason?: ServerEmittedError): void {
    if (reason) this.emitError(reason)
    this.socket.disconnect()
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
   * @param event The close event.
   */
  private onClose = (): void => {
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
   * Handler for when the web socket event is sent by a client.
   * @param event The message event data.
   */
  private onMessage = async (data: string): Promise<void> => {
    let event: TClientEvent
    let looseEventData:
      | ReturnType<(typeof looseEventSchema)['parse']>
      | undefined

    // If the data passed is not a string,
    // throw an error.
    if (typeof data !== 'string') {
      this.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_INVALID_DATA, {
          message: 'The data passed was not a string.',
        }),
      )
      return
    }

    try {
      // Parse the data from a string into a
      // JSON object.
      let rawEventData = JSON.parse(data)
      // Ensure the data is formatted correctly
      // for METIS.
      looseEventData = looseEventSchema.parse(rawEventData)

      // Get the Zod schema to validate the event
      // specific to its method.
      let { method } = looseEventData
      let zodSchema = clientEventSchemas[method]

      // Validate/sanitize the data.
      event = zodSchema.parse(looseEventData)

      // Update the rate limiter.
      await this.limiter.consume(this.userId)
    } catch (error) {
      let request: TRequestOfResponse | undefined

      // If the data passed loose-validation and
      // the data contains a requestId, build the
      // request data to include in the error event.
      if (looseEventData && looseEventData.requestId) {
        request = this.buildResponseReqData(looseEventData as any)
      }

      // If the error is a rate limiter error,
      // emit a rate limit error.
      if (error instanceof RateLimiterRes) {
        this.emitError(
          new ServerEmittedError(ServerEmittedError.CODE_MESSAGE_RATE_LIMIT, {
            request,
          }),
        )
        return
      }

      this.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_INVALID_DATA, {
          message: 'The data passed is invalid.',
          request,
        }),
      )
      return
    }

    // Call any listeners matching the method found in the
    // data.
    for (let [method, listener] of this.listeners) {
      if (event.method === method) {
        listener(event)
      }
    }
  }

  /**
   * Emits an event to the client.
   * @param socket The socket connection to emit the event to.
   * @param method The method of the event to emit.
   * @param payload The payload of the event to emit.
   */
  public static emit<
    TMethod extends TServerMethod,
    TPayload extends Omit<TServerEvents[TMethod], 'method'>,
  >(method: TMethod, payload: TPayload, socket: Socket): void {
    // Send payload.
    socket.send(JSON.stringify({ method, ...payload }))
  }

  /**
   * Emits an error to the given socket connection.
   * @param error The error to emit.
   * @param socket The socket connection to emit the error.
   */
  public static emitError(error: ServerEmittedError, socket: Socket): void {
    let payload: TServerEvents['error'] = error.toJson()
    socket.send(JSON.stringify(payload))
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
}

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
