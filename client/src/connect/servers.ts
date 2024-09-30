import { io, Socket } from 'socket.io-client'
import SessionClient from 'src/sessions'
import { TEventListenerTarget } from 'src/toolbox/hooks'
import Logging from 'src/toolbox/logging'
import { v4 as generateHash } from 'uuid'
import {
  TAnyResponseEvent,
  TClientEvent,
  TClientMethod,
  TGenericClientEvents,
  TGenericClientMethod,
  TRequestEvents,
  TRequestMethod,
  TResponseEvents,
  TResponseMethod,
  TServerConnectionStatus,
  TServerEvent,
  TServerEvents,
  TServerMethod,
} from '../../../shared/connect/data'
import { ServerEmittedError } from '../../../shared/connect/errors'
import { SingleTypeObject } from '../../../shared/toolbox/objects'

/**
 * METIS web-socket-based, server connection.
 */
export default class ServerConnection
  implements TEventListenerTarget<TServerMethod>
{
  /**
   * The web socket connection itself.
   */
  public socket: Socket

  /**
   * Tracks whether the connection should be open, regardless of if it is.
   */
  protected shouldBeConnected: boolean = false

  /**
   * The timestamp for when the connection was last opened.
   */
  protected _lastOpened: number | null = null
  /**
   * The timestamp for when the connection was last opened.
   */
  public get lastOpened(): number | null {
    return this._lastOpened
  }

  /**
   * The timestamp for when the connection was last closed.
   */
  protected _lastClosed: number | null = null
  /**
   * The timestamp for when the connection was last closed.
   */
  public get lastClosed(): number | null {
    return this._lastClosed
  }

  /**
   * The status of the connection.
   */
  private _status: TServerConnectionStatus = 'connecting'
  /**
   * The status of the connection.
   */
  public get status(): TServerConnectionStatus {
    return this._status
  }

  /**
   * Storage for all listeners, in the order they get added.
   */
  protected listeners: [TServerMethod, TServerHandler<any>][] = []

  /**
   * A map of request IDs to response listeners. These listeners will be called
   * anytime an event is received from the server with the corresponding request ID.
   */
  protected responseListeners: SingleTypeObject<
    TServerResponseListener<TResponseMethod>
  > = {}

  /**
   * A list of data for requests that have yet to be fulfilled.
   */
  private _unfulfilledRequests: TUnfulfilledReqData[] = []
  /**
   * A list of data for requests that have yet to be fulfilled.
   */
  public get unfulfilledRequests(): TUnfulfilledReqData[] {
    return [...this._unfulfilledRequests]
  }

  /**
   * The number of requests that have yet to be fulfilled.
   */
  public get unfulfilledReqCount(): number {
    return this._unfulfilledRequests.length
  }

  /**
   * Whether there are any unfulfilled requests.
   */
  public get hasUnfulfilledRequests(): boolean {
    return this.unfulfilledReqCount > 0
  }

  /**
   * @param options Options for the server connection.
   */
  public constructor(options: IServerConnectionOptions = {}) {
    // Establish web socket connection given options passed.
    this.socket = this.createSocket(options)

    // Add event listeners passed in options.
    if (options.on !== undefined) {
      for (let [key, value] of Object.entries(options.on) as any) {
        this.addEventListener(key, value)
      }
    }

    // Add default listeners.
    this.addDefaultListeners()

    // Prepare socket for use.
    this.prepareSocket()
  }

  /**
   * Creates a web socket connection with the server.
   */
  private createSocket(options: IServerConnectionOptions): Socket {
    const { disconnectExisting } = options
    let url: string = ServerConnection.SOCKET_URL
    let extraHeaders: Record<string, string> = {}

    // If disconnectExisting is true, add the header.
    if (disconnectExisting) extraHeaders['Disconnect-Existing'] = 'true'

    // Create a new web socket connection.
    let socket: Socket = io(url, {
      transportOptions: {
        polling: {
          extraHeaders,
        },
      },
    })

    // Set `shouldBeConnected` to true.
    this.shouldBeConnected = true

    // Return the socket connection.
    return socket
  }

  /**
   * Prepares the socket for use.
   */
  private prepareSocket(): void {
    // Add event listeners.
    this.socket.on('connect', this.onOpen)
    this.socket.on('disconnect', this.onClose)
    this.socket.on('connect_error', this.onSocketError)
    this.socket.on('message', this.onMessage)
  }

  /**
   * Emits a generic event to the server.
   * @param method The method of the event to emit.
   * @param data The payload of the event to emit.
   */
  public emit<
    TMethod extends TGenericClientMethod,
    TData extends TGenericClientEvents[TMethod]['data'],
  >(method: TMethod, data: TData): void {
    // Send payload.
    this.socket.send(JSON.stringify({ method, data }))
    // Handle activity.
    this.onActivity(method)
  }

  /**
   * Emits a request event to the server.
   * @param method The method of the event to emit.
   * @param payload The payload of the event to emit.
   * @param statusMessage The status message to display until the request is fulfilled.
   * @param options Options for the request.
   */
  public request<
    TMethod extends TRequestMethod,
    TPayload extends TRequestEvents[TMethod]['data'],
  >(
    method: TMethod,
    data: TPayload,
    statusMessage: string,
    options: TWsRequestOptions = {},
  ): void {
    // Parse options.
    const { onResponse } = options

    // Generate request ID.
    let requestId: string = ServerConnection.generateRequestId()

    // Add response listener if provided.
    if (onResponse !== undefined) {
      this.responseListeners[requestId] = onResponse
    }

    // Add request ID to unfulfilled requests.
    this._unfulfilledRequests.push({
      id: requestId,
      timestamp: Date.now(),
      statusMessage,
    })

    // Send payload.
    this.socket.send(JSON.stringify({ method, requestId, data }))

    // Handle activity.
    this.onActivity(method)
  }

  /**
   * Adds a listener for a specific server event method.
   * @param method The event method that will be handled. The handler will only be called if the method matches what is sent by the server in a web socket message, except for 'open', 'close', and 'error' events, which are called upon their respective web socket events.
   * @param handler The handler that will be called upon the event being triggered.
   * @returns The server connection instance, allowing the chaining of class method calls.
   */
  public addEventListener<TMethod extends TServerMethod>(
    method: TMethod,
    handler: TServerHandler<TMethod>,
  ): ServerConnection {
    // Push the new listener to the array of listeners.
    this.listeners.push([method, handler])
    // Return this.
    return this
  }

  /**
   * Adds a listener for a specific server event method.
   * @param method The event method that will be handled. The handler will only be called if the method matches what is sent by the server in a web socket message, except for 'open', 'close', and 'error' events, which are called upon their respective web socket events.
   * @param handler The handler that will be called upon the event being triggered.
   * @returns The server connection instance, allowing the chaining of class method calls.
   */
  public removeEventListener(
    handler: TServerHandler<TServerMethod>,
  ): ServerConnection {
    // Filter out the handler.
    this.listeners = this.listeners.filter(([, h]) => h !== handler)
    // Return this.
    return this
  }

  /**
   * Adds default listeners for the server connection.
   */
  protected addDefaultListeners(): void {}

  /**
   * Clears event listeners from the connection.
   * @param filter A list of handler types to remove. Any handler matching any type in the filter will be cleared.
   * If this is undefined, all handlers will be removed from the connection.
   * @returns The number of matching event listeners removed.
   */
  public clearEventListeners(filter?: TServerMethod[]): number {
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
   * Clears all unfufilled requests.
   */
  public clearUnfulfilledRequests(): void {
    this._unfulfilledRequests = []
  }

  /**
   * Disconnects from the server, closing the web socket connection.
   */
  public disconnect(): void {
    this.shouldBeConnected = false
    this.socket.close()
  }

  /**
   * Fetches the currently joined session.
   * @resolves The new session client for the session.
   * @rejects If there is an error joining the session.
   */
  public $fetchCurrentSession(): Promise<SessionClient> {
    return new Promise((resolve, reject) => {
      this.request('request-current-session', {}, 'Fetching current session.', {
        onResponse: (event) => {
          switch (event.method) {
            case 'current-session':
              resolve(
                new SessionClient(
                  event.data.session,
                  this,
                  event.data.memberId,
                ),
              )
              break
            case 'error':
              reject(new Error(event.message))
              break
            default:
              let error: Error = new Error(
                `Unknown response method for ${event.request.event.method}: '${event.method}'.`,
              )
              console.log(error)
              console.log(event)
              reject(error)
          }
        },
      })
    })
  }

  /**
   * Joins a session with the given session ID.
   * @param sessionId The ID of the session to join.
   * @resolves The new session client for the session, `null` if not found.
   * @rejects If there is an error joining the session.
   */
  public $joinSession(sessionId: string): Promise<SessionClient | null> {
    return new Promise((resolve, reject) => {
      this.request('request-join-session', { sessionId }, 'Joining session.', {
        onResponse: (event) => {
          switch (event.method) {
            case 'session-joined':
              resolve(
                new SessionClient(
                  event.data.session,
                  this,
                  event.data.memberId,
                ),
              )
              break
            case 'error':
              // Resolve null if not found.
              if (event.code === ServerEmittedError.CODE_SESSION_NOT_FOUND) {
                resolve(null)
              }
              // Otherwise, reject with error.
              else {
                reject(new Error(event.message))
              }
              break
            default:
              let error: Error = new Error(
                `Unknown response method for ${event.request.event.method}: '${event.method}'.`,
              )
              console.log(error)
              console.log(event)
              reject(error)
          }
        },
      })
    })
  }

  /**
   * Handles any activity on the connection by calling
   * any activity listeners.
   */
  private onActivity(
    event: TClientMethod | TClientEvent | TServerMethod | TServerEvent,
  ): void {
    let method: TClientMethod | TServerMethod =
      typeof event === 'string' ? event : event.method

    // Call any listeners that match with the method 'activity'.
    for (let [method, listener] of this.listeners) {
      if (method === 'activity') {
        listener({ method: 'activity' })
      }
    }

    // Log activity.
    if (typeof event === 'object' && event.method === 'error') {
      Logging.error(event.message, Logging.CONTEXT_WS, [
        method,
        event.code.toString(),
      ])
    } else if (method === 'error') {
      Logging.error('', Logging.CONTEXT_WS, [method])
    } else {
      Logging.info('', Logging.CONTEXT_WS, [method])
    }
  }

  /**
   * Handler for when the web socket connection is opened.
   * Calls all "open" listeners stored in "listeners".
   */
  private onOpen = (): void => {
    // Gather details.
    let wasOpenedBefore: boolean = this._lastOpened !== null

    // Update `lastOpened` and status.
    this._lastOpened = Date.now()
    this._status = 'open'

    // Determine method.
    let determinedMethod: TServerMethod = wasOpenedBefore
      ? 'reconnection-success'
      : 'connection-success'

    // Loop through listeners.
    for (let [method, listener] of this.listeners) {
      // Call any with the method 'open'.
      if (method === determinedMethod) {
        listener({ method })
      }
      // Call any handlers that match the 'connection-change'
      // method.
      if (method === 'connection-change') {
        listener({
          method: 'connection-change',
          status: this.status,
        })
      }
    }

    // Handle activity.
    this.onActivity(determinedMethod)
  }

  /**
   * Handler for when the web socket connection is closed.
   * Calls all "close" and "connection-loss" listeners stored
   * in "listeners".
   * @param event The close event.
   */
  private onClose = (): void => {
    // Gather information.
    let shouldBeOpen: boolean = this.shouldBeConnected
    let wasOnceOpened: boolean = this._lastOpened !== null
    let wasOnceClosed: boolean = this._lastClosed !== null
    let wasOpenUntilNow: boolean =
      this._lastOpened !== null &&
      (this._lastClosed === null || this._lastClosed < this._lastOpened)

    // Determine event type.
    let isConnectionClosedEvent: boolean = !shouldBeOpen
    let isConnectionFailureEvent: boolean =
      shouldBeOpen && !wasOpenUntilNow && !wasOnceOpened
    let isConnectionLossEvent: boolean = shouldBeOpen && wasOpenUntilNow
    let isReconnectionFailureEvent: boolean =
      shouldBeOpen && !wasOpenUntilNow && wasOnceClosed

    // Determine method and update status.
    let determinedMethod: TServerMethod

    if (isConnectionClosedEvent) {
      determinedMethod = 'connection-closed'
      this._status = 'closed'
    } else if (isConnectionFailureEvent) {
      determinedMethod = 'connection-failure'
      this._status = 'connecting'
    } else if (isConnectionLossEvent) {
      determinedMethod = 'connection-loss'
      this._status = 'connecting'
    } else if (isReconnectionFailureEvent) {
      determinedMethod = 'reconnection-failure'
      this._status = 'connecting'
    } else {
      throw new Error('Unknown close event type.')
    }

    // Update lastClosed.
    this._lastClosed = Date.now()

    // Loop though listeners.
    for (let [method, listener] of this.listeners) {
      // Call any handlers that match the determined
      // method.
      if (method === determinedMethod) {
        listener({ method: determinedMethod })
      }
      // Call any handlers that match the 'connection-change'
      // method.
      if (method === 'connection-change') {
        listener({
          method: 'connection-change',
          status: this.status,
        })
      }
    }

    // Handle activity.
    this.onActivity(determinedMethod)
  }

  /**
   * Handler for when the web socket connection is opened. Calls all matching listeners stored in "listeners".
   * @param e The message event data.
   */
  private onMessage = (data: string): void => {
    // Parse the data.
    let event: any = JSON.parse(data)

    // Handle errors before calling
    // individual listeners.
    if (event.method === 'error') {
      // Create new server emitted error
      // object.
      let error: ServerEmittedError = ServerEmittedError.fromJson(event)

      // If the error indicates that the server intends
      // to close the connection, set `shouldBeConnected`
      // to false.
      if (
        error.code === ServerEmittedError.CODE_DUPLICATE_CLIENT ||
        error.code === ServerEmittedError.CODE_MESSAGE_RATE_LIMIT ||
        error.code === ServerEmittedError.CODE_SWITCHED_CLIENT ||
        error.code === ServerEmittedError.CODE_UNAUTHENTICATED
      ) {
        this.shouldBeConnected = false
      }
    }

    // Call any listeners that match the method of the message.
    for (let [method, listener] of this.listeners) {
      if (event.method === method) {
        listener(event)
      }
    }

    // If the message contains a request...
    if (event.request !== undefined) {
      // Grab request.
      let request: TAnyResponseEvent['request'] = event.request
      // Grab response listener.
      let responseListener:
        | TServerResponseListener<TResponseMethod>
        | undefined = this.responseListeners[request.event.requestId]

      // If the listener is present, call it.
      if (responseListener !== undefined) {
        responseListener(event)
      }

      // If the request was fulfilled with this response,
      // remove the listener and remove the ID from the unfulfilled
      // request list. Otherwise, maintain things for the next response.
      if (request.fulfilled) {
        delete this.responseListeners[request.event.requestId]
        this._unfulfilledRequests = this._unfulfilledRequests.filter(
          ({ id }) => id !== request.event.requestId,
        )
      }
    }

    // Handle activity.
    this.onActivity(event)
  }

  /**
   * Handler for when a socket-specific error occurs. This is different
   * from a server-emitted error, which is handled in `onMessage`.
   */
  private onSocketError = (error: Error): void => {
    // Attempt to parse the error message to
    // a server emitted error.
    try {
      // Attempt to parse the error message.
      let errorData: any = JSON.parse(error.message)
      ServerEmittedError.fromJson(errorData)

      // If successful, pass the raw string
      // to the `onMessage` handler.
      this.onMessage(error.message)
    } catch (e) {
      // Else, dynamically generate an event
      // from the information known.
      let event: TServerEvents['error'] = {
        method: 'error',
        message: error.message,
        code: ServerEmittedError.CODE_UNKNOWN,
      }
      // Handle activity.
      this.onActivity(event)
    }
  }

  /**
   * The end point for establishing a web socket connection.
   */
  public static get SOCKET_URL() {
    let inBrowser: boolean = typeof window !== 'undefined'
    let useSecure: boolean = window?.location.protocol === 'https:'

    if (!inBrowser) {
      return '/'
    } else if (useSecure) {
      return `wss://${window.location.host}`
    } else {
      return `ws://${window.location.host}`
    }
  }

  /**
   * The amount of time to wait before attempting to reconnect to the server.
   */
  public static readonly RECONNECT_COOLDOWN: number = 1000

  /**
   * Generates a new request ID for a request to the server.
   */
  private static generateRequestId(): any {
    return `request_${generateHash()}`
  }
}

/* -- types -- */

/**
 * Represents a handler in a server connection for a client-emitted event.
 */
export type TServerHandler<TMethod extends TServerMethod> = (
  event: TServerEvents[TMethod],
) => void

/**
 * Represents a listener for a response to a request.
 */
export type TServerResponseListener<TMethod extends TResponseMethod> = (
  event: TResponseEvents[TMethod] | TServerEvents['error'],
) => void

/**
 * Represents options that can be passed when constructing a new server connection.
 */
export interface IServerConnectionOptions {
  /**
   * Listeners for handling various events.
   */
  on?: {
    [T in TServerMethod]?: TServerHandler<T>
  }
  /**
   * Disconnects the existing connection for the current login.
   * @default false
   */
  disconnectExisting?: boolean
}

/**
 * Options for the `ServerConnection.request` method.
 */
export type TWsRequestOptions = {
  /**
   * Handler for response events sent by the server concerning the request.
   * @param method The method of the server event.
   * @param data The data sent by the server.
   * @note May be multiple responses depending on the type of request.
   */
  onResponse?: TServerResponseListener<TResponseMethod>
}

/**
 * Data cached for an unfulfilled request.
 */
export type TUnfulfilledReqData = {
  /**
   * The ID of the request.
   */
  id: string
  /**
   * The timestamp for when the request was made.
   */
  timestamp: number
  /**
   * The status message to display until the request is fulfilled.
   */
  statusMessage: string
}
