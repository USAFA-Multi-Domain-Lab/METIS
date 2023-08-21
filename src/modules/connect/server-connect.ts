import {
  IServerDataTypes,
  TServerData,
  TServerMethod,
} from 'src/modules/connect/data'

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
  public static readonly SOCKET_URL = `ws://${window.location.host}/connect`

  /**
   * The web socket connection itself.
   */
  protected socket: WebSocket

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
    // Add a the correct event listener to
    // socket based on the method passed.
    switch (method) {
      case 'open':
        // Add an open event listener to
        // the socket.
        this.socket.addEventListener('open', (event) => {
          handler({ method } as any)
        })
        break
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

export default ServerConnection
