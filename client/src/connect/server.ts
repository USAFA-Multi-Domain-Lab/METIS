import {
  IClientDataTypes,
  IServerDataTypes,
  TClientMethod,
  TServerData,
  TServerMethod,
} from '../../../shared/connect/data'
import { ServerEmittedError } from '../../../shared/connect/errors'
import { v4 as generateHash } from 'uuid'

/**
 * Represents a handler in a server connection for a client-emitted event.
 */
export type TServerHandler<TMethod extends TServerMethod> = (
  data: TServerData<TMethod>,
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
   * Whether to disconnect existing connections in order to establish this connection. Defaults to false.
   * @WIP
   */
  disconnectExisting?: boolean
}

/**
 * METIS web-socket-based, server connection.
 */
export class ServerConnection {
  /**
   * The web socket connection itself.
   */
  public socket: WebSocket

  /**
   * Tracks whether the connection should be open, regardless of if it is.
   */
  protected shouldBeConnected: boolean = false

  /**
   * The timestamp for when the connection was last opened.
   */
  protected lastOpened: number | null = null

  /**
   * The timestamp for when the connection was last closed.
   */
  protected lastClosed: number | null = null

  /**
   * The ready state of the web socket connection.
   */
  public get readyState(): number {
    return this.socket.readyState
  }

  /**
   * Storage for all listeners, in the order they get added.
   */
  protected listeners: [TServerMethod, TServerHandler<any>][] = []

  /**
   * @param {IServerConnectionOptions} options Options for the server connection.
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
  private createSocket(
    options: IServerConnectionOptions,
    bad: boolean = false,
  ): WebSocket {
    let url: string = bad
      ? ServerConnection.SOCKET_URL_BAD
      : ServerConnection.SOCKET_URL

    // Add disconnectExisting query if
    // requested.
    if (options.disconnectExisting) {
      url += '?disconnectExisting=true'
    }

    // Create a new web socket connection.
    let socket: WebSocket = new WebSocket(url)

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
    this.socket.addEventListener('open', this.onOpen)
    this.socket.addEventListener('close', this.onClose)
    this.socket.addEventListener('message', this.onMessage)
    this.socket.addEventListener('error', this.onSocketError)
  }

  /**
   * Attempts to reconnect after a connection loss.
   */
  public reconnect(): void {
    // Create new socket connection.
    this.socket = this.createSocket({ disconnectExisting: true })

    // Prepare new socket connection.
    this.prepareSocket()
  }

  reconnectBad = (): void => {
    // Create new socket connection.
    this.socket = new WebSocket(ServerConnection.SOCKET_URL_BAD)

    // Prepare new socket connection.
    this.prepareSocket()

    // this.reconnectBad = this.reconnect
  }

  /**
   * Emits an event to the server.
   * @param {TMethod} method The method of the event to emit.
   * @param {TPayload} payload The payload of the event to emit.
   */
  public emit<
    TMethod extends TClientMethod,
    TPayload extends Omit<IClientDataTypes[TMethod], 'method'>,
  >(method: TMethod, payload: TPayload): void {
    console.log(this.lastOpened, this.lastClosed)
    // Send payload.
    this.socket.send(JSON.stringify(payload))
  }

  /**
   * Adds a listener for a specific server event method.
   * @param {TServerMethod} method The event method that will be handled. The handler will only be called if the method matches what is sent by the server in a web socket message, except for 'open', 'close', and 'error' events, which are called upon their respective web socket events.
   * @param {TServerHandler<TServerEvent>} handler The handler that will be called upon the event being triggered.
   * @returns {ServerConnection} The server connection instance, allowing the chaining of class method calls.
   */
  public addEventListener<
    TMethod extends TServerMethod,
    TData extends IServerDataTypes[TMethod],
  >(method: TMethod, handler: TServerHandler<TMethod>): ServerConnection {
    // Push the new listener to the array of listeners.
    this.listeners.push([method, handler])
    // Return this.
    return this
  }

  /**
   * Adds default listeners for the server connection.
   */
  protected addDefaultListeners(): void {
    this.addEventListener('connection-success', () => {
      // Log event.
      console.log('Server connection opened.')
    })
    this.addEventListener('reconnection-success', () => {
      // Log event.
      console.log('Server connection reopened.')
    })
    this.addEventListener('connection-closed', () => {
      // Log event.
      console.log('Server connection closed.')
    })
    this.addEventListener('connection-loss', () => {
      // Log event.
      console.log('Server connection lost.')
      // Wait duration of `RECONNECT_COOLDOWN` before attempting
      // to reconnect.
      setTimeout(() => this.reconnect(), ServerConnection.RECONNECT_COOLDOWN)
    })
    this.addEventListener('connection-failure', () => {
      // Log event.
      console.log('Server connection failed.')
      // Wait duration of `RECONNECT_COOLDOWN` before attempting
      // to reconnect.
      setTimeout(() => this.reconnect(), ServerConnection.RECONNECT_COOLDOWN)
    })
    this.addEventListener('reconnection-failure', () => {
      // Log event.
      console.log('Server reconnection failed.')
      // Wait duration of `RECONNECT_COOLDOWN` before attempting
      // to reconnect.
      setTimeout(() => this.reconnect(), ServerConnection.RECONNECT_COOLDOWN)
    })
    this.addEventListener('error', ({ code, message }) => {
      console.error(`Server Connection Error (${code}):\n${message}`)
    })
  }

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
   * Disconnects from the server, closing the web socket connection.
   */
  public disconnect(): void {
    this.shouldBeConnected = false
    this.socket.close()
  }

  /**
   * Handler for when the web socket connection is opened. Calls all "open" listeners stored in "listeners".
   * @param {Event} event The open event.
   */
  private onOpen = (event: Event): void => {
    // Gather details.
    let wasOpenedBefore: boolean = this.lastOpened !== null

    // Update `lastOpened`.
    this.lastOpened = Date.now()

    // Determine method.
    let determinedMethod: TServerMethod = wasOpenedBefore
      ? 'reconnection-success'
      : 'connection-success'

    // Loop through listeners and call
    // any with the method 'open'.
    for (let [method, listener] of this.listeners) {
      if (method === determinedMethod) {
        listener({ method })
      }
    }
  }

  /**
   * Handler for when the web socket connection is closed. Calls all "close" and "connection-loss" listeners stored in "listeners".
   * @param {CloseEvent} event The close event.
   */
  private onClose = (event: CloseEvent): void => {
    // Gather information.
    let shouldBeOpen: boolean = this.shouldBeConnected
    let wasOnceOpened: boolean = this.lastOpened !== null
    let wasOnceClosed: boolean = this.lastClosed !== null
    let wasOpenUntilNow: boolean =
      this.lastOpened !== null &&
      (this.lastClosed === null || this.lastClosed < this.lastOpened)

    // Determine event type.
    let isConnectionClosedEvent: boolean = !shouldBeOpen
    let isConnectionFailureEvent: boolean =
      shouldBeOpen && !wasOpenUntilNow && !wasOnceOpened
    let isConnectionLossEvent: boolean = shouldBeOpen && wasOpenUntilNow
    let isReconnectionFailureEvent: boolean =
      shouldBeOpen && !wasOpenUntilNow && wasOnceClosed

    // Determine method.
    let determinedMethod: TServerMethod

    if (isConnectionClosedEvent) {
      determinedMethod = 'connection-closed'
    } else if (isConnectionFailureEvent) {
      determinedMethod = 'connection-failure'
    } else if (isConnectionLossEvent) {
      determinedMethod = 'connection-loss'
    } else if (isReconnectionFailureEvent) {
      determinedMethod = 'reconnection-failure'
    } else {
      throw new Error('Unknown close event type.')
    }

    // Update lastClosed.
    this.lastClosed = Date.now()

    // Loop though listeners.
    for (let [method, listener] of this.listeners) {
      // Call any handlers that match the determined
      // method.
      if (method === determinedMethod) {
        listener({ method: determinedMethod })
      }
    }
  }

  /**
   * Handler for when the web socket connection is opened. Calls all matching listeners stored in "listeners".
   * @param {MessageEvent} event The message event.
   */
  private onMessage = (event: MessageEvent): void => {
    for (let [method, listener] of this.listeners) {
      // Parse the data.
      let data = JSON.parse(event.data)

      // Handle errors before calling
      // individual listeners.
      if (data.method === 'error') {
        // Create new server emitted error
        // object.
        let error: ServerEmittedError = ServerEmittedError.fromJSON(data)

        // If the error is a duplicate client
        // issue, mark shouldBeConnected as
        // false.
        if (error.code === ServerEmittedError.CODE_DUPLICATE_CLIENT) {
          this.shouldBeConnected = false
        }
      }

      // Only call the handler if the method matches.
      if (data.method === method) {
        listener(data)
      }
    }
  }

  /**
   * Handler for when a socket-specific error occurs. This is different from a server-emitted error, which
   * is handled in `onMessage`.
   */
  private onSocketError = (event: Event): void => {
    let isClosed: boolean =
      this.socket.readyState === WebSocket.CLOSED ||
      this.socket.readyState === WebSocket.CLOSING
    let neverOpened: boolean = this.lastOpened === null
    let shouldHaveOpened: boolean = this.shouldBeConnected

    // If the connection is closed, never opened,
    // but should have opened, call any connection
    // failure listeners.
    if (isClosed && neverOpened && shouldHaveOpened) {
      // Pre-create data object since
      // they will not vary.
      let data: TServerData<'connection-failure'> = {
        method: 'connection-failure',
      }

      // Loop though listeners.
      for (let [method, listener] of this.listeners) {
        // Call any connection loss listeners
        // if the closing of the connection
        // was unprompted.
        if (method === 'connection-failure') {
          listener(data)
        }
      }
    }
  }

  /**
   * The end point for establishing a web socket connection.
   */
  public static readonly SOCKET_URL =
    typeof window !== 'undefined' ? `ws://${window.location.host}/connect` : '/'

  public static SOCKET_URL_BAD = 'ws://localhost:8085/connect'

  /**
   * The amount of time to wait before attempting to reconnect to the server.
   */
  public static readonly RECONNECT_COOLDOWN: number = 1000

  /**
   * Generates a new request ID for a request to the server.
   */
  public static generateRequestID(): any {
    return `request_${generateHash()}`
  }
}

export default ServerConnection
