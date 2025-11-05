import BooleanToolbox from 'metis/toolbox/booleans'
import WebSocket, { ClientOptions } from 'ws'
import z from 'zod'
import { Api, apiOptionsSchema } from '.'
import { AnyObject } from '../toolbox'

/**
 * The WebSocket API class is used to establish real-time communication with target environments.
 */
export class WebSocketApi extends Api {
  /**
   * The WebSocket URL where the connection can be established.
   */
  private _url: string
  /**
   * The WebSocket URL where the connection can be established.
   */
  public get url(): string {
    return this._url
  }

  /**
   * The WebSocket connection options.
   */
  private _options: ClientOptions
  /**
   * The WebSocket connection options.
   */
  public get options(): ClientOptions {
    return this._options
  }

  /**
   * The active WebSocket connection.
   */
  private _connection: WebSocket | null = null
  /**
   * The active WebSocket connection.
   */
  public get connection(): WebSocket | null {
    return this._connection
  }

  /**
   * The current connection state.
   */
  public get state(): WebSocket['readyState'] {
    return this._connection?.readyState ?? WebSocket.CLOSED
  }

  /**
   * Whether the WebSocket is currently connected.
   */
  public get isConnected(): boolean {
    return this.state === WebSocket.OPEN
  }

  /**
   * Storage for all event listeners, in the order they get added.
   */
  protected listeners: [TWebSocketEventType, TWebSocketEventHandler<any>][] = []

  /**
   * Controls whether TLS client verifies the server's certificate against
   * trusted Certificate Authorities (CAs).
   * @note If true, the server will reject any connection which is not authorized
   * with the trusted Certificate Authorities (CAs).
   * @note If false, the server will accept any certificate, even if it is invalid.
   * @default true
   */
  public get rejectUnauthorized(): boolean | undefined {
    return this._options.rejectUnauthorized
  }

  /**
   * Connection timeout in milliseconds.
   */
  public get connectTimeout(): number {
    return (
      this._options.handshakeTimeout ?? WebSocketApi.DEFAULT_CONNECT_TIMEOUT
    )
  }

  /**
   * @param options Used to configure how the WebSocket
   * connection is established.
   */
  public constructor(options: TWebSocketApiOptions = {}) {
    super()

    // Build the WebSocket URL.
    this._url = this.buildWebSocketUrl(options)

    // Build the connection options.
    this._options = this.buildConnectionOptions(options)
  }

  /**
   * Builds the WebSocket URL for the connection.
   * @param options The options to use to build the URL.
   * @returns The WebSocket URL for the connection.
   */
  private buildWebSocketUrl(options: TWebSocketApiOptions): string {
    // Initialize the URL.
    let url: string = ''
    let defaultPort: string = '80'

    // If there's a protocol...
    if (options.protocol) {
      // Update the port if the protocol is WSS.
      if (options.protocol === 'wss') defaultPort = '443'
      // Update the URL.
      url = `${options.protocol}://`
    } else {
      // Set the default protocol to WS.
      url = 'ws://'
    }

    // If there's a host...
    if (options.host) {
      // Use a regular expression to check if the host contains a port.
      let portRegex: RegExp = /.*:([0-9]+).*/
      // If the host contains a port...
      if (portRegex.test(options.host)) {
        // Add the entire host.
        url += options.host
      }
      // Or if there's a separate port...
      else if (options.port) {
        // Add the host and the port.
        url += `${options.host}:${options.port}`
      }
      // Otherwise, add the host and the default port.
      else {
        url += `${options.host}:${defaultPort}`
      }
    }
    // Or if there's a port without host...
    else if (options.host === undefined && options.port !== undefined) {
      // Add localhost and the port.
      url += `localhost:${options.port}`
    }
    // Otherwise, use localhost and the default port.
    else {
      url += `localhost:${defaultPort}`
    }

    // Return the URL.
    return url
  }

  /**
   * Builds the connection options for the WebSocket.
   * @param options The options to use to build the connection options.
   * @returns The connection options for the WebSocket.
   */
  private buildConnectionOptions(
    options: TWebSocketApiOptions,
  ): WebSocketApi['options'] {
    // Initialize the connection options.
    let connectionOptions: WebSocketApi['options'] = {}

    // Store rejection of unauthorized certificates.
    if (options.rejectUnauthorized !== undefined) {
      connectionOptions.rejectUnauthorized = options.rejectUnauthorized
    }

    // Store the handshake timeout (default 10 seconds).
    connectionOptions.handshakeTimeout =
      options.connectTimeout ?? WebSocketApi.DEFAULT_CONNECT_TIMEOUT

    // Return the connection options.
    return connectionOptions
  }

  /**
   * Adds a listener for specific WebSocket event types.
   * @param eventTypes The event type(s) to listen for.
   * @param handler The handler function to call when the event occurs.
   */
  public addEventListener<T extends TWebSocketEventType>(
    eventTypes: T | T[],
    handler: TWebSocketEventHandler<T>,
  ): void {
    if (!Array.isArray(eventTypes)) {
      eventTypes = [eventTypes]
    }

    for (const eventType of eventTypes) {
      this.listeners.push([eventType, handler])
    }
  }

  /**
   * Removes a listener for a specific WebSocket event type.
   * @param eventType The event type to stop listening for.
   * @param handler The specific handler to remove.
   */
  public removeEventListener<T extends TWebSocketEventType>(
    eventType: T,
    handler: TWebSocketEventHandler<T>,
  ): void {
    this.listeners = this.listeners.filter(
      ([type, h]) => type !== eventType || h !== handler,
    )
  }

  /**
   * Clears event listeners from the connection.
   * @param filter A list of event types to remove. If undefined, all listeners are removed.
   * @returns The number of listeners removed.
   */
  public clearEventListeners(filter?: TWebSocketEventType[]): number {
    let removalCount = 0

    if (filter === undefined) {
      removalCount = this.listeners.length
      this.listeners = []
    } else {
      this.listeners = this.listeners.filter(([eventType]) => {
        if (filter.includes(eventType)) {
          removalCount++
          return false
        }
        return true
      })
    }

    return removalCount
  }

  /**
   * Emits an event to all registered listeners.
   * @param event The event to emit.
   */
  protected emitEvent<T extends TWebSocketEventType>(
    event: TWebSocketEvents[T],
  ): void {
    // Call all matching listeners
    for (const [eventType, listener] of this.listeners) {
      if (event.method === eventType) {
        listener(event)
      }
    }

    // Always emit activity events
    if (event.method !== 'activity') {
      this.emitEvent({
        method: 'activity',
        eventType: event.method,
      })
    }
  }

  /**
   * Establishes a WebSocket connection.
   * @returns A promise that resolves when the connection is established.
   */
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // If already connected, resolve immediately.
        if (this.isConnected) {
          resolve()
          return
        }

        // Close existing connection if any and wait for it to close.
        if (
          this._connection &&
          this._connection.readyState !== WebSocket.CLOSED
        ) {
          this._connection.close()
          this._connection = null
        }

        // Create new WebSocket connection with options.
        this._connection = new WebSocket(this._url, this._options)

        // Handle connection opened.
        this._connection.on('open', () => {
          this.emitEvent({ method: 'open' })
          this.emitEvent({
            method: 'connection-change',
            isConnected: true,
          })
          resolve()
        })

        // Handle messages.
        this._connection.on('message', (data: WebSocket.Data) => {
          try {
            let parsedData: any = data
            // Try to parse JSON if data is a string or buffer.
            if (typeof data === 'string') {
              try {
                parsedData = JSON.parse(data)
              } catch {
                // Keep as string if not valid JSON.
                parsedData = data
              }
            } else if (Buffer.isBuffer(data)) {
              const stringData = data.toString()
              try {
                parsedData = JSON.parse(stringData)
              } catch {
                parsedData = stringData
              }
            }

            this.emitEvent({
              method: 'message',
              data: parsedData,
              raw: data,
            })
          } catch (error) {
            this.emitEvent({
              method: 'error',
              error: error as Error,
            })
          }
        })

        // Handle errors.
        this._connection.on('error', (error: Error) => {
          this.emitEvent({ method: 'error', error })
          reject(error)
        })

        // Handle connection closed.
        this._connection.on('close', (code: number, reason: Buffer) => {
          this.emitEvent({
            method: 'close',
            code,
            reason: reason.toString(),
          })
          this.emitEvent({
            method: 'connection-change',
            isConnected: false,
          })
          this._connection = null
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Closes the WebSocket connection.
   * @param code The close code to send.
   * @param reason The reason for closing.
   */
  public disconnect(code?: number, reason?: string): void {
    if (this._connection && this.state !== WebSocket.CLOSED) {
      this._connection.close(code, reason)
    }
  }

  /**
   * Sends data through the WebSocket connection.
   * @param data The data to send.
   * @returns A promise that resolves when the data is sent.
   */
  public send(data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('WebSocket is not connected'))
        return
      }

      try {
        let payload: string
        if (typeof data === 'string') {
          payload = data
        } else {
          payload = JSON.stringify(data)
        }

        this._connection!.send(payload)
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Sends a JSON message through the WebSocket connection.
   * @param message The message object to send.
   * @returns A promise that resolves when the message is sent.
   */
  public async sendMessage(message: AnyObject): Promise<void> {
    return await this.send(message)
  }

  /**
   * Creates a WebSocket API using the configuration from environment variables.
   * @param envConfig The environment configuration to use.
   * @returns A WebSocket API instance.
   * @throws If the configuration is invalid.
   * @example
   * ```typescript
   * import { WebSocketApi } from './library/api/websocket'
   * import { loadConfig } from './library/config'
   * const api = WebSocketApi.fromConfig(loadConfig())
   * ```
   */
  public static fromConfig(
    envConfig: Record<string, string | undefined>,
  ): WebSocketApi {
    try {
      let rejectUnauthorized: boolean | undefined = undefined
      if (envConfig.rejectUnauthorized !== undefined) {
        rejectUnauthorized = BooleanToolbox.parse(envConfig.rejectUnauthorized)
      }

      const webSocketOptions: TWebSocketApiOptions =
        webSocketApiOptionsSchema.parse({
          ...envConfig,
          rejectUnauthorized,
        })
      return new WebSocketApi(webSocketOptions)
    } catch (error: any) {
      throw new Error(`Invalid WebSocket API configuration: ${error.message}`)
    }
  }

  /**
   * The default connection timeout in milliseconds.
   */
  private static readonly DEFAULT_CONNECT_TIMEOUT = 10000 // 10 seconds
}

/**
 * WebSocket API options schema.
 */
const webSocketApiOptionsSchema = apiOptionsSchema.extend({
  /**
   * The protocol to use for the API. This determines the scheme used for
   * the network requests.
   * @see {@link [GeeksforGeeks Reference](https://www.geeksforgeeks.org/computer-networks/web-protocols/)}
   * @default 'ws'
   */
  protocol: z.enum(['ws', 'wss']).optional(),
  /**
   * Connection timeout in milliseconds. How long to wait for the WebSocket
   * handshake to complete before giving up. Uses the native WebSocket
   * handshakeTimeout option.
   * @default 10000 (10 seconds)
   * @min 1000 (1 second)
   * @max 60000 (60 seconds)
   */
  connectTimeout: z.number().int().min(1000).max(60000).optional(),
})

/**
 * The options used to create a WebSocket API.
 */
export type TWebSocketApiOptions = z.infer<typeof webSocketApiOptionsSchema>

/**
 * WebSocket event types.
 */
export type TWebSocketEventType =
  | 'open'
  | 'close'
  | 'error'
  | 'message'
  | 'connection-change'
  | 'activity'

/**
 * WebSocket event data structures.
 */
export type TWebSocketEvents = {
  'open': { method: 'open' }
  'close': { method: 'close'; code: number; reason: string }
  'error': { method: 'error'; error: Error }
  'message': { method: 'message'; data: any; raw: WebSocket.Data }
  'connection-change': { method: 'connection-change'; isConnected: boolean }
  'activity': { method: 'activity'; eventType: TWebSocketEventType }
}

/**
 * WebSocket event handler type.
 */
export type TWebSocketEventHandler<T extends TWebSocketEventType> = (
  event: TWebSocketEvents[T],
) => void
