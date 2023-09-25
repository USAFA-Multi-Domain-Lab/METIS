import { WebSocket } from 'ws'
import {
  TServerData,
  TClientData,
  TClientMethod,
  TServerMethod,
  IServerDataTypes,
} from 'metis/connect/data'
import { ServerEmittedError } from 'metis/connect/errors'
import User from 'metis/users'
import MetisSession from 'metis/server/sessions'

export type TClientHandler<TMethod extends TClientMethod> = (
  data: TClientData<TMethod>,
) => void

/**
 * Represents options that can be passed when constructing a new client connection.
 */
export interface IClientConnectionOptions {
  on?: {
    [T in TClientMethod]?: TClientHandler<T>
  }
  /**
   * Whether to disconnect existing connections for the given session.
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
 * METIS web-socket-based, client connection.
 * @throws {Error} If the session passed already has a client.
 */
export default class ClientConnection {
  /**
   * The web socket connection itself.
   */
  protected socket: WebSocket
  /**
   * The session associated with this client.
   */
  protected _session: MetisSession
  /**
   * The session associated with this client.
   */
  public get session(): MetisSession {
    return this._session
  }

  /**
   * The user in the session.
   */
  public get user(): User {
    return this.session.user
  }

  /**
   * The userID for the user in the session.
   */
  public get userID(): string {
    return this.session.userID
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
    session: MetisSession,
    options: IClientConnectionOptions = {},
  ) {
    this.socket = socket
    this._session = session

    let { disconnectExisting = false } = options

    // If session already contains a client,
    // handle conflict.
    if (session.client !== null) {
      // If disconnectExisting was opted,
      // disconnect the existing client.
      if (disconnectExisting) {
        session.client.disconnect()
      }
      // Else, reject new connection by
      // emmitting a duplicate client error
      // and disconnecting.
      else {
        this.emitError(
          new ServerEmittedError(ServerEmittedError.CODE_DUPLICATE_CLIENT),
        )
        this.disconnect()
        throw Error('The session passed already has a client.')
      }
    }

    session.client = this

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
    TPayload extends Omit<IServerDataTypes[TMethod], 'method'>,
  >(method: TMethod, payload: TPayload): void {
    // Send payload.
    this.socket.send(JSON.stringify(payload))
  }

  /**
   * Emits an error to the client.
   * @param {ServerEmittedError} error The error to emit to the client.
   */
  public emitError(error: ServerEmittedError): void {
    let payload: TServerData<'error'> = error.toJSON()
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
    // None to add currently...
  }

  /**
   * Disconnects from the server, closing the web socket connection.
   */
  protected disconnect(): void {
    this.socket.close()
  }

  /**
   * Handler for when the web socket connection is closed. Calls all "close" listeners stored in "listeners".
   * @param {WSCloseEvent} event The close event.
   */
  private onClose = (event: WSCloseEvent): void => {
    // Pre-create data object, since
    // it will not vary.
    let closeData: TServerData<'close'> = { method: 'close' }

    // Loop though listeners.
    for (let [method, listener] of this.listeners) {
      // Call any "close" listeners.
      if (method === 'close') {
        listener(closeData)
      }
    }

    // Clear client from session.
    this.session.client = null
  }

  /**
   * Handler for when the web socket connection is opened. Calls all matching listeners stored in "listeners".
   * @param {WSCloseEvent} event The message event.
   */
  private onMessage = (event: WSMessageEvent): void => {
    for (let [method, listener] of this.listeners) {
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

      // Only call the handler if the method matches.
      if (data.method === method) {
        listener(data)
      }
    }
  }
}
