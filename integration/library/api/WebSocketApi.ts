import type { TAnyObject } from '@metis/toolbox/objects/ObjectToolbox'
import WebSocket, { type ClientOptions } from 'ws'
import z from 'zod'
import { Api, apiOptionsSchema } from './Api'

/**
 * The WebSocket API class is used to establish real-time communication with target environments.
 */
export class WebSocketApi extends Api {
  /**
   * Backing field for {@link url}.
   */
  private _url: string
  /**
   * The WebSocket URL where the connection can be established.
   */
  public get url(): string {
    return this._url
  }

  /**
   * Backing field for {@link options}.
   */
  private _options: ClientOptions
  /**
   * The WebSocket connection options.
   */
  public get options(): ClientOptions {
    return this._options
  }

  /**
   * Backing field for {@link connection}.
   */
  private _connection: WebSocket | null = null
  /**
   * The active WebSocket connection.
   */
  public get connection(): WebSocket | null {
    return this._connection
  }

  /**
   * The reject callback for a connect() promise that is currently in flight.
   * Stored so that a subsequent connect() call can reject the prior promise
   * rather than leaving it pending indefinitely.
   */
  private _pendingConnectReject: ((error: Error) => void) | null = null

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
   * Whether the client is configured to automatically reconnect.
   */
  public get autoReconnect(): boolean {
    return this._autoReconnect
  }

  /**
   * The number of reconnect attempts made since the last successful open.
   */
  public get reconnectAttemptCount(): number {
    return this._reconnectAttemptCount
  }

  /**
   * Storage for all event listeners, in the order they get added.
   */
  protected listeners: [TWebSocketEventType, TWebSocketEventHandler<any>][] = []

  /**
   * Whether the socket should attempt to reconnect after an unexpected close.
   */
  private _autoReconnect: boolean

  /**
   * Whether the connection has successfully opened at least once.
   * @note Used to avoid background reconnect loops on initial startup failure.
   */
  private _hasConnectedOnce: boolean = false

  /**
   * Whether the most recent disconnect was user initiated.
   */
  private _manualDisconnect: boolean = false

  /**
   * The number of reconnect attempts made since the last successful open.
   */
  private _reconnectAttemptCount: number = 0

  /**
   * A scheduled reconnect timer.
   */
  private _reconnectTimer: NodeJS.Timeout | null = null

  /**
   * Interval (ms) for WebSocket keepalive pings.
   */
  private _keepAliveIntervalMs: number

  /**
   * Timeout (ms) to wait for a pong after pinging before terminating.
   */
  private _keepAliveTimeoutMs: number

  /**
   * A scheduled keepalive ping interval.
   */
  private _keepAliveInterval: NodeJS.Timeout | null = null

  /**
   * A scheduled pong timeout timer.
   */
  private _keepAlivePongTimeout: NodeJS.Timeout | null = null

  /**
   * Base reconnect delay in milliseconds.
   */
  private _reconnectDelayMs: number

  /**
   * Max reconnect delay in milliseconds.
   */
  private _maxReconnectDelayMs: number

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

    // Reconnect + keepalive options.
    this._autoReconnect = options.autoReconnect ?? true
    this._keepAliveIntervalMs =
      options.keepAliveInterval ?? WebSocketApi.DEFAULT_KEEP_ALIVE_INTERVAL
    this._keepAliveTimeoutMs =
      options.keepAliveTimeout ?? WebSocketApi.DEFAULT_KEEP_ALIVE_TIMEOUT
    this._reconnectDelayMs =
      options.reconnectDelay ?? WebSocketApi.DEFAULT_RECONNECT_DELAY
    this._maxReconnectDelayMs =
      options.maxReconnectDelay ?? WebSocketApi.DEFAULT_MAX_RECONNECT_DELAY
  }

  /**
   * Clears any active keepalive timers.
   */
  private clearKeepAliveTimers(): void {
    if (this._keepAliveInterval) {
      clearInterval(this._keepAliveInterval)
      this._keepAliveInterval = null
    }

    if (this._keepAlivePongTimeout) {
      clearTimeout(this._keepAlivePongTimeout)
      this._keepAlivePongTimeout = null
    }
  }

  /**
   * Clears any scheduled reconnect timer.
   */
  private clearReconnectTimer(): void {
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer)
      this._reconnectTimer = null
    }
  }

  /**
   * Schedules a reconnect attempt with exponential backoff and jitter.
   */
  private scheduleReconnect(): void {
    this.clearReconnectTimer()

    if (!this._autoReconnect) {
      return
    }

    // Never reconnect if the user explicitly disconnected.
    if (this._manualDisconnect) {
      return
    }

    // Avoid reconnect loops on startup if the initial connect fails.
    if (!this._hasConnectedOnce) {
      return
    }

    this._reconnectAttemptCount += 1

    let baseDelay = this._reconnectDelayMs
    let exponentialDelay =
      baseDelay * Math.pow(2, this._reconnectAttemptCount - 1)
    let delay = Math.min(this._maxReconnectDelayMs, exponentialDelay)

    // Add +/- 20% jitter.
    let jitterFactor = 0.8 + Math.random() * 0.4
    delay = Math.floor(delay * jitterFactor)

    this._reconnectTimer = setTimeout(() => {
      // If a manual disconnect happened after scheduling, stop.
      if (this._manualDisconnect) {
        return
      }

      // Fire and forget; events surface via listeners.
      // The close handler fires after every failed attempt and calls
      // scheduleReconnect() — no additional call is needed here.
      this.connect().catch(() => {})
    }, delay)
  }

  /**
   * Starts the keepalive loop on the current connection.
   * @note Uses WebSocket ping/pong frames to detect half-open connections.
   */
  private startKeepAlive(): void {
    this.clearKeepAliveTimers()

    if (!this._connection || this._connection.readyState !== WebSocket.OPEN) {
      return
    }

    if (this._keepAliveIntervalMs <= 0) {
      return
    }

    let connection = this._connection

    this._keepAliveInterval = setInterval(() => {
      if (this._connection !== connection) {
        return
      }

      if (connection.readyState !== WebSocket.OPEN) {
        return
      }

      // Reset pong timeout for this ping.
      if (this._keepAlivePongTimeout) {
        clearTimeout(this._keepAlivePongTimeout)
        this._keepAlivePongTimeout = null
      }

      if (this._keepAliveTimeoutMs > 0) {
        this._keepAlivePongTimeout = setTimeout(() => {
          // If we didn't receive a pong in time, terminate.
          if (this._connection !== connection) {
            return
          }
          if (connection.readyState === WebSocket.OPEN) {
            try {
              connection.terminate()
            } catch {
              // ignore
            }
          }
        }, this._keepAliveTimeoutMs)
      }

      try {
        connection.ping()
      } catch {
        // If ping fails, let the socket error/close handlers drive reconnect.
      }
    }, this._keepAliveIntervalMs)
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

    for (let eventType of eventTypes) {
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
    for (let [eventType, listener] of this.listeners) {
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
   * @resolves when the connection is established.
   * @rejects If the connection attempt fails, times out, or is superseded by a subsequent connect() call.
   */
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // If already connected, resolve immediately.
        if (this.isConnected) {
          resolve()
          return
        }

        // We are explicitly attempting to connect.
        this._manualDisconnect = false
        this.clearReconnectTimer()

        // If a prior connect() is still in CONNECTING state, reject it
        // immediately so its caller is not left waiting indefinitely, then
        // reject this call too — the caller should wait and retry.
        if (
          this._connection &&
          this._connection.readyState === WebSocket.CONNECTING
        ) {
          if (this._pendingConnectReject) {
            this._pendingConnectReject(
              new Error('Connection superseded by a new connect() call.'),
            )
            this._pendingConnectReject = null
          }

          try {
            this._connection.terminate()
          } catch {
            // ignore
          }

          this._connection = null

          reject(
            new Error(
              'connect() called while a connection attempt was already in progress.',
            ),
          )

          return
        }

        // Close any non-CLOSED, non-CONNECTING connection.
        if (
          this._connection &&
          this._connection.readyState !== WebSocket.CLOSED
        ) {
          try {
            this._connection.close()
          } catch {
            // ignore
          }
        }

        // Ensure we don't keep timers alive from prior sockets.
        this.clearKeepAliveTimers()

        // Create new WebSocket connection with options.
        this._connection = new WebSocket(this._url, this._options)
        let connection = this._connection
        this._pendingConnectReject = reject

        // Handle connection opened.
        connection.on('open', () => {
          if (this._connection !== connection) {
            return
          }

          this._pendingConnectReject = null
          this._hasConnectedOnce = true
          this._reconnectAttemptCount = 0

          this.emitEvent({ method: 'open' })
          this.emitEvent({
            method: 'connection-change',
            isConnected: true,
          })

          this.startKeepAlive()
          resolve()
        })

        // Handle messages.
        connection.on('message', (data: WebSocket.Data) => {
          if (this._connection !== connection) {
            return
          }
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
          } catch (error: any) {
            this.emitEvent({
              method: 'error',
              error,
            })
          }
        })

        // Keepalive: clear pong timeout on pong.
        connection.on('pong', () => {
          if (this._connection !== connection) {
            return
          }
          if (this._keepAlivePongTimeout) {
            clearTimeout(this._keepAlivePongTimeout)
            this._keepAlivePongTimeout = null
          }
        })

        // Handle errors.
        connection.on('error', (error: Error) => {
          if (this._connection !== connection) {
            return
          }
          this._pendingConnectReject = null
          this.emitEvent({ method: 'error', error })
          reject(error)
        })

        // Handle connection closed.
        connection.on('close', (code: number, reason: Buffer) => {
          if (this._connection !== connection) {
            return
          }

          this.clearKeepAliveTimers()

          this.emitEvent({
            method: 'close',
            code,
            reason: reason.toString(),
          })
          this.emitEvent({
            method: 'connection-change',
            isConnected: false,
          })
          this._pendingConnectReject = null
          this._connection = null

          // Attempt auto-reconnect for long-lived sessions.
          this.scheduleReconnect()
        })
      } catch (error) {
        this._pendingConnectReject = null
        reject(error)
      }
    })
  }

  /**
   * Closes the WebSocket connection.
   * @param code The close code to send.
   * @param reason The reason for closing.
   * @resolves when the connection has been fully closed.
   */
  public disconnect(code?: number, reason?: string): Promise<void> {
    return new Promise((resolve) => {
      this._manualDisconnect = true
      this.clearReconnectTimer()
      this.clearKeepAliveTimers()

      // Reset reconnect attempt count on manual disconnect.
      this._reconnectAttemptCount = 0

      if (!this._connection || this.state === WebSocket.CLOSED) {
        this._connection = null
        resolve()
        return
      }

      let connection = this._connection

      connection.once('close', () => {
        if (this._connection === connection) {
          this._connection = null
        }
        resolve()
      })

      try {
        connection.close(code, reason)
      } catch {
        // If close throws, we still want the caller to proceed.
        this._connection = null
        resolve()
      }
    })
  }

  /**
   * Sends data through the WebSocket connection.
   * @param data The data to send.
   * @resolves when the data has been sent.
   * @rejects If the WebSocket is not connected or the data cannot be serialized.
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
   * @resolves when the message has been sent.
   * @rejects If the WebSocket is not connected or the message cannot be serialized.
   */
  public async sendMessage(message: TAnyObject): Promise<void> {
    return await this.send(message)
  }

  /**
   * Creates a WebSocket API using the configuration from environment variables.
   * @param envConfig The environment configuration to use.
   * @returns A WebSocket API instance.
   * @throws If the configuration is invalid.
   */
  public static fromConfig(
    envConfig: Record<string, unknown | undefined>,
  ): WebSocketApi {
    try {
      const webSocketOptions: TWebSocketApiOptions =
        webSocketApiOptionsSchema.parse(envConfig)
      return new WebSocketApi(webSocketOptions)
    } catch (error: any) {
      throw new Error(`Invalid WebSocket API configuration: ${error.message}`)
    }
  }

  /**
   * The default connection timeout in milliseconds.
   */
  private static readonly DEFAULT_CONNECT_TIMEOUT = 10000 // 10 seconds

  /**
   * The default keepalive interval in milliseconds.
   */
  private static readonly DEFAULT_KEEP_ALIVE_INTERVAL = 30000 // 30 seconds

  /**
   * The default keepalive pong timeout in milliseconds.
   */
  private static readonly DEFAULT_KEEP_ALIVE_TIMEOUT = 10000 // 10 seconds

  /**
   * The default base reconnect delay in milliseconds.
   */
  private static readonly DEFAULT_RECONNECT_DELAY = 1000 // 1 second

  /**
   * The default max reconnect delay in milliseconds.
   */
  private static readonly DEFAULT_MAX_RECONNECT_DELAY = 30000 // 30 seconds
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

  /**
   * Whether the client should attempt to reconnect after an unexpected close.
   * @default true
   */
  autoReconnect: z.boolean().optional(),

  /**
   * Keepalive ping interval (ms). Set to 0 to disable keepalive.
   * @default 30000 (30 seconds)
   */
  keepAliveInterval: z.number().int().min(0).max(300000).optional(),

  /**
   * Keepalive pong timeout (ms). If no pong is received within this window,
   * the socket will be terminated.
   * @default 10000 (10 seconds)
   */
  keepAliveTimeout: z.number().int().min(0).max(60000).optional(),

  /**
   * Base reconnect delay in milliseconds.
   * @default 1000 (1 second)
   */
  reconnectDelay: z.number().int().min(250).max(60000).optional(),

  /**
   * Max reconnect delay in milliseconds.
   * @default 30000 (30 seconds)
   */
  maxReconnectDelay: z.number().int().min(1000).max(300000).optional(),
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
