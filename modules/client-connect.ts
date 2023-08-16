import { WebSocket } from 'ws'
import MetisSession from '../session/session'

/**
 * An error thrown in the ClientConnection class.
 */
export class ClientError {
  public message: string

  public constructor(message: string) {
    this.message = message
  }
}

/**
 * Represents the types of data sent from the client to the server over a web socket during various events.
 */
export interface IClientDataTypes {
  close: {
    method: 'close'
  }
  error: {
    method: 'error'
    message: string
  }
  join: {
    method: 'join'
    gameID: string
  }
}

/**
 * Represents the type of event that occurs on the client that is sent to the server over a web socket.
 */
export type TClientMethod = keyof IClientDataTypes

export type TClientData<TMethod extends TClientMethod> =
  IClientDataTypes[TMethod]

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
}

/**
 * METIS web-socket-based, client connection.
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

  /**
   * @param {WebSocket} socket The web socket connection itself.
   * @param {IClientConnectionOptions} options Options for the server connection.
   */
  public constructor(
    socket: WebSocket,
    session: MetisSession,
    options: IClientConnectionOptions = {},
  ) {
    if (session.client !== undefined) {
      this.sendError(new ClientError('The session passed already has a client.'))
    }

    this.socket = socket
    this._session = session
    session.client = this

    // Add event listeners passed in
    // options.
    if (options.on !== undefined) {
      for (let [key, value] of Object.entries(options.on) as any) {
        this.addEventListener(key, value)
      }
    }
  }

  /**
   * Sends an error to the client.
   * @param {ClientError} error The error to send to the client.
   */
  public sendError(error: ClientError): void {
    this.socket.send(
      JSON.stringify({
        method: 'error',
        message: error.message,
      }),
    )
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
        // the socket.
        this.socket.addEventListener('close', (event) => {
          handler({ method } as any)
        })
        break
      default:
        // Add a message event listener to
        // the socket.
        this.socket.addEventListener('message', (event) => {
          // If the data passed is not a string,
          // throw an error.
          if (typeof event.data !== 'string') {
            this.sendError(new ClientError('The data passed was not a string.'))
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
}

export default ClientConnection
