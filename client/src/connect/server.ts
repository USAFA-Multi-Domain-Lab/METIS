import {
  IClientDataTypes,
  IServerDataTypes,
  TClientMethod,
  TServerData,
  TServerMethod,
} from 'metis/connect/data'
import { ServerEmittedError } from 'metis/connect/errors'
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
   * The end point for establishing a web socket connection.
   */
  public static readonly SOCKET_URL =
    typeof window !== 'undefined' ? `ws://${window.location.host}/connect` : '/'

  /**
   * The web socket connection itself.
   */
  protected socket: WebSocket

  /**
   * Tracks whether the connection should be open, regardless of if it is.
   */
  protected shouldBeConnected: boolean = false

  /**
   * Storage for all listeners, in the order they get added.
   */
  protected listeners: Map<TServerMethod, TServerHandler<any>> = new Map<
    TServerMethod,
    TServerHandler<any>
  >()

  /**
   * @param {IServerConnectionOptions} options Options for the server connection.
   */
  public constructor(options: IServerConnectionOptions = {}) {
    let url: string = ServerConnection.SOCKET_URL

    // Add disconnectExisting query if
    // requested.
    if (options.disconnectExisting) {
      url += '?disconnectExisting=true'
    }

    // Create a new web socket connection.
    this.socket = new WebSocket(url)

    // Add event listeners passed in
    // options.
    if (options.on !== undefined) {
      for (let [key, value] of Object.entries(options.on) as any) {
        this.addEventListener(key, value)
      }
    }

    // Prepare socket for use.
    this.prepareSocket()
  }

  /**
   * Prepares the socket for use.
   */
  private prepareSocket(): void {
    // Add event listeners.
    this.socket.addEventListener('open', this.onOpen)
    this.socket.addEventListener('close', this.onClose)
    this.socket.addEventListener('message', this.onMessage)
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
    this.listeners.set(method, handler)
    // Return this.
    return this
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
    // Pre-create data object since
    // they will not vary.
    let data: TServerData<'open'> = { method: 'open' }

    // Set shouldBeConnected to true.
    this.shouldBeConnected = true

    // Loop through listeners and call
    // any with the method 'open'.
    for (let [method, listener] of this.listeners) {
      if (method === 'open') {
        listener(data)
      }
    }
  }

  /**
   * Handler for when the web socket connection is closed. Calls all "close" and "connection-loss" listeners stored in "listeners".
   * @param {CloseEvent} event The close event.
   */
  private onClose = (event: CloseEvent): void => {
    // Pre-create all data objects since
    // they will not vary.
    let closeData: TServerData<'close'> = { method: 'close' }
    let connectionLossData: TServerData<'connection-loss'> = {
      method: 'connection-loss',
    }

    // Loop though listeners.
    for (let [method, listener] of this.listeners) {
      // Call any connection loss listeners
      // if the closing of the connection
      // was unprompted.
      if (method === 'connection-loss' && this.shouldBeConnected) {
        listener(connectionLossData)
      }
    }

    // Loop though listeners again.
    for (let [method, listener] of this.listeners) {
      // Call any regular close listeners,
      // after all connection-loss listeners
      // have been run.
      if (method === 'close') {
        listener(closeData)
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
   * Generates a new request ID for a request to the server.
   */
  public static generateRequestID(): any {
    return `request_${generateHash()}`
  }
}

export default ServerConnection
