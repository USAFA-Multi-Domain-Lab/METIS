/**
 * An error thrown in the ServerConnection class.
 */
export class ServerConnectionError {}

/**
 * Represents the types of data sent from the server to the client over a web socket.
 */
export interface IServerDataTypes {
  open: {
    method: 'open'
  }
  close: {
    method: 'close'
  }
  error: {
    method: 'error'
    error: ServerConnectionError
  }
  join: {
    method: 'join'
    gameID: string
  }
}

/**
 * Represents a type of event that occurs on the server that is sent to the client over a web socket.
 */
export type TServerMethod = keyof IServerDataTypes

export type TServerData<TMethod extends TServerMethod> =
  IServerDataTypes[TMethod]

export type TClientHandler<TMethod extends TServerMethod> = (
  data: TServerData<TMethod>,
) => void

/**
 * Represents options that can be passed when constructing a new server connection.
 */
export interface IServerConnectionOptions {
  on?: {
    [T in TServerMethod]?: TClientHandler<T>
  }
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
    this.socket = new WebSocket(ServerConnection.SOCKET_URL)

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
   * @param {TClientHandler<TServerEvent>} handler The handler that will be called upon the event being triggered.
   * @returns {ServerConnection} The server connection instance, allowing the chaining of class method calls.
   */
  public addEventListener<
    TMethod extends TServerMethod,
    TData extends IServerDataTypes[TMethod],
  >(method: TMethod, handler: TClientHandler<TMethod>): ServerConnection {
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
