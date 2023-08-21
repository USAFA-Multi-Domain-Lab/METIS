import { WebSocket } from 'ws'
import MetisSession from '../../../session/session'
import {
  IClientDataTypes,
  TServerData,
  TClientData,
  TClientMethod,
} from 'src/modules/connect/data'
import { ServerEmittedError } from './errors'

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
  Parameters<typeof WebSocket.prototype.addEventListener>[1]
>[0]

/**
 * METIS web-socket-based, client connection.
 * @throws {Error} If the session passed already has a client.
 */
export class ClientConnection {
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

  protected onCloseListeners: Array<TClientHandler<'close'>> = []

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
        this.sendError(
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
  }

  /**
   * Prepares the socket for use.
   */
  private prepareSocket(): void {
    // Add a close event listener to
    // the socket.
    this.socket.addEventListener('close', this.onClose)
  }

  /**
   * Sends an error to the client.
   * @param {ServerEmittedError} error The error to send to the client.
   */
  public sendError(error: ServerEmittedError): void {
    let payload: TServerData<'error'> = error.toJSON()
    this.socket.send(JSON.stringify(payload))
  }

  /**
   * Adds a listener for a specific client event method.
   * @param {TClientMethod} method The event method that will be handled. The handler will only be called if the method matches what is sent by the client in a web socket message, except for 'close', and 'error' events, which are called upon their respective web socket events.
   * @param {TClientHandler<TServerEvent>} handler The handler that will be called upon the event being triggered.
   * @returns {ClientConnection} The client connection instance, allowing the chaining of class method calls.
   */
  public addEventListener<
    TMethod extends TClientMethod,
    TData extends IClientDataTypes[TMethod],
  >(method: TMethod, handler: TClientHandler<TMethod>): ClientConnection {
    // Add a the correct event listener to
    // socket based on the method passed.
    switch (method) {
      case 'close':
        // Add a close event listener to
        // the list of close listeners.
        this.onCloseListeners.push(handler as TClientHandler<'close'>)
        break
      default:
        // Add a message event listener to
        // the socket.
        this.socket.addEventListener('message', (event) => {
          // If the data passed is not a string,
          // throw an error.
          if (typeof event.data !== 'string') {
            this.sendError(
              new ServerEmittedError(
                ServerEmittedError.CODE_INVALID_DATA,
                'The data passed was not a string.',
              ),
            )
            return
          }

          // Parse the data.
          let data: TData = JSON.parse(event.data)

          // Only call the handler if the method matches.
          if (data.method === method) {
            handler(data)
          }
        })
    }
    return this
  }

  /**
   * Disconnects from the server, closing the web socket connection.
   */
  public disconnect(): void {
    this.socket.close()
  }

  /**
   * Handler for when the web socket connection is closed. Calls all closed listeners stored in the object.
   * @param {WSCloseEvent} event The close event.
   */
  private onClose = (event: WSCloseEvent): void => {
    // Run all on-close listeners.
    this.onCloseListeners.forEach((listener) => listener({ method: 'close' }))

    // Remove the client from the session.
    this.session.client = null
  }
}

export default ClientConnection
