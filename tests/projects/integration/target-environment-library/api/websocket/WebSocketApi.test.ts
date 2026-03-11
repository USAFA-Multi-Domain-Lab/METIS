import {
  WebSocketApi,
  type TWebSocketApiOptions,
} from '@integrations/api/WebSocketApi'
import { afterEach, describe, expect, test } from '@jest/globals'
import crypto from 'crypto'
import { createServer as createHTTPServer } from 'http'
import type { AddressInfo, Socket as NetSocket } from 'net'
import type WebSocket from 'ws'
import { WebSocketServer } from 'ws'

describe('WebSocketApi', () => {
  /**
   * All {@link WebSocketApi} instances created during a test. Each is
   * disconnected in `afterEach` to ensure open connections do not outlive
   * the test that owns them.
   */
  let activeApis: WebSocketApi[] = []
  /**
   * All servers started during a test. Each is closed in `afterEach` so the
   * bound port is released and the test process can exit cleanly.
   */
  let activeServers: Array<{ close(cb?: (error?: Error) => void): void }> = []
  /**
   * Raw TCP sockets created by HTTP servers. Tracked so they can be destroyed
   * in afterEach before server.close() is called — allowing the server close
   * callback to fire promptly rather than waiting for lingering connections.
   */
  let activeRawSockets: Set<NetSocket> = new Set()

  /**
   * Registers a raw TCP socket for automatic cleanup in afterEach.
   * @param socket The socket to track.
   */
  function trackSocket(socket: NetSocket): void {
    activeRawSockets.add(socket)
    socket.once('close', () => activeRawSockets.delete(socket))
  }

  /**
   * Starts a plain WebSocket server on a random available port.
   * @resolves with the server instance and the port it is bound to.
   * @rejects If the server fails to start.
   */
  function startServer(): Promise<{ server: WebSocketServer; port: number }> {
    return new Promise((resolve, reject) => {
      let server = new WebSocketServer({ port: 0 })
      server.once('listening', () => {
        let port = (server.address() as AddressInfo).port
        activeServers.push(server)
        resolve({ server, port })
      })
      server.once('error', reject)
    })
  }

  /**
   * Starts an HTTP server that accepts TCP connections but never completes
   * the WebSocket upgrade handshake, leaving WebSocket clients in CONNECTING
   * state indefinitely.
   * @resolves with the port the server is bound to.
   */
  function startHangingServer(): Promise<{ port: number }> {
    return new Promise((resolve) => {
      let server = createHTTPServer()
      server.on('connection', (socket) => {
        // Accept the TCP connection but discard all data, never responding
        // with an HTTP 101 Switching Protocols. WebSocket clients stay in
        // CONNECTING state until their underlying socket is explicitly closed.
        trackSocket(socket)
        socket.on('data', () => {})
      })
      server.listen(0, () => {
        let port = (server.address() as AddressInfo).port
        activeServers.push(server)
        resolve({ port })
      })
    })
  }

  /**
   * Starts an HTTP server that completes the WebSocket upgrade handshake but
   * reads and discards all subsequent frames, including pings. Clients that
   * send pings will never receive a pong, which triggers the WebSocketApi
   * keepalive pong-timeout path.
   * @resolves with the port the server is bound to.
   */
  function startNoPongServer(): Promise<{ port: number }> {
    return new Promise((resolve) => {
      let server = createHTTPServer()
      server.on('connection', (socket) => {
        trackSocket(socket)
      })
      server.on('upgrade', (request, socket: NetSocket, _head) => {
        let key = request.headers['sec-websocket-key'] as string
        if (!key) {
          socket.destroy()
          return
        }
        let responseKey = crypto
          .createHash('sha1')
          .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
          .digest('base64')
        socket.write(
          'HTTP/1.1 101 Switching Protocols\r\n' +
            'Upgrade: websocket\r\n' +
            'Connection: Upgrade\r\n' +
            `Sec-WebSocket-Accept: ${responseKey}\r\n\r\n`,
        )
        // Discard all WebSocket frames (pings included) without responding.
        socket.on('data', () => {})
      })
      server.listen(0, () => {
        let port = (server.address() as AddressInfo).port
        activeServers.push(server)
        resolve({ port })
      })
    })
  }

  /**
   * Creates a {@link WebSocketApi} instance and registers it for automatic cleanup in afterEach.
   * @param options The options to pass to the WebSocketApi constructor.
   * @returns The created WebSocketApi instance.
   */
  function makeApi(options: TWebSocketApiOptions): WebSocketApi {
    let api = new WebSocketApi(options)
    activeApis.push(api)
    return api
  }

  /**
   * Resolves after the given number of milliseconds.
   * @param milliseconds The number of milliseconds to wait.
   * @resolves when the delay has elapsed.
   */
  function wait(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds))
  }

  /**
   * Races a promise against a deadline.
   * @param promise The promise to observe.
   * @param milliseconds The maximum time to wait in milliseconds.
   * @resolves with true if the promise settled within the deadline, or false if
   * it was still pending when the deadline expired.
   */
  function settlesWithin(
    promise: Promise<unknown>,
    milliseconds: number,
  ): Promise<boolean> {
    let settled = false
    return Promise.race([
      promise
        .then(
          () => {
            settled = true
          },
          () => {
            settled = true
          },
        )
        .then(() => settled),
      wait(milliseconds).then(() => settled),
    ])
  }

  afterEach(async () => {
    for (let api of activeApis) {
      await api.disconnect().catch(() => {})
    }
    activeApis = []

    // Destroy raw TCP sockets first so HTTP server.close() callbacks fire
    // immediately rather than waiting for lingering connections to drain.
    for (let socket of activeRawSockets) {
      socket.destroy()
    }
    activeRawSockets.clear()

    await Promise.allSettled(
      activeServers.map(
        (server) =>
          new Promise<void>((resolve) => server.close(() => resolve())),
      ),
    )
    activeServers = []
  }, 15000)

  // ---------------------------------------------------------------------------

  test('connect() resolves when the server accepts the socket and emits open, connection-change, and activity events in the expected order', async () => {
    let { port } = await startServer()
    let api = makeApi({ port })
    let order: string[] = []

    api.addEventListener('open', () => order.push('open'))
    api.addEventListener('connection-change', () =>
      order.push('connection-change'),
    )
    api.addEventListener('activity', (event) =>
      order.push(`activity:${event.eventType}`),
    )

    await expect(api.connect()).resolves.toBeUndefined()
    expect(api.isConnected).toBe(true)
    expect(order).toEqual([
      'open',
      'activity:open',
      'connection-change',
      'activity:connection-change',
    ])
  })

  // ! This test currently FAILS and exposes a known bug. !
  // When connect() is called a second time while the first is still in
  // CONNECTING state, the second call closes the first socket via the identity
  // guard. The first promise's reject() is never invoked, leaving it pending
  // indefinitely. See report findings for details.
  test('A second connect() call while the first is pending does not leave the first promise unresolved indefinitely', async () => {
    let { port } = await startHangingServer()
    // autoReconnect disabled to prevent background retries from muddying the result.
    let api = makeApi({ port, autoReconnect: false })

    let firstConnect = api.connect()
    // Allow time for the TCP handshake to complete so the first socket is
    // genuinely in flight before the second call replaces it.
    await wait(30)
    let secondConnect = api.connect()

    // Start both timeout races before awaiting either so that rejection
    // handlers are attached to both promises unconditionally. Without this,
    // if the firstConnect assertion throws, secondConnect has no rejection
    // handler and afterEach's disconnect() causes an unhandled rejection that
    // bleeds into the next test.
    let firstResult = settlesWithin(firstConnect, 3000)
    let secondResult = settlesWithin(secondConnect, 3000)

    expect(await firstResult).toBe(true)
    expect(await secondResult).toBe(true)
  }, 10000)

  test('An unexpected server-side close increments reconnectAttemptCount and resets it to 0 after a successful reconnect', async () => {
    let { server, port } = await startServer()
    let api = makeApi({
      port,
      autoReconnect: true,
      reconnectDelay: 100,
      maxReconnectDelay: 500,
    })

    await api.connect()
    expect(api.reconnectAttemptCount).toBe(0)

    // Register both the close and open listeners before triggering the close so
    // we never miss a fast reconnect.
    let resolveReconnected!: () => void
    let reconnected = new Promise<void>((resolve) => {
      resolveReconnected = resolve
    })
    let onOpen = (_event: { method: 'open' }) => {
      api.removeEventListener('open', onOpen)
      resolveReconnected()
    }

    api.addEventListener('open', onOpen)

    // Resolve once the close event surfaces through WebSocketApi.
    let closeSeen = new Promise<void>((resolve) => {
      let onClose = () => {
        api.removeEventListener('close', onClose)
        resolve()
      }
      api.addEventListener('close', onClose)
    })

    // Terminate all server-side connections to trigger an unexpected close.
    server.clients.forEach((socket) => socket.terminate())

    // scheduleReconnect() runs synchronously inside the 'close' handler,
    // after emitEvent('close') returns. The microtask continuation below
    // resumes only after that entire handler — including scheduleReconnect() —
    // has finished, so the count is guaranteed to be non-zero by then.
    // This avoids the timing race inherent in using an arbitrary wait() delay
    // when the reconnect timer fires with a short jitter window.
    await closeSeen
    expect(api.reconnectAttemptCount).toBeGreaterThan(0)

    // Wait for the server to accept the new connection before asserting the
    // reset so afterEach does not call disconnect() on a CONNECTING socket.
    await reconnected
    expect(api.reconnectAttemptCount).toBe(0)
    expect(api.isConnected).toBe(true)
  }, 5000)

  test('disconnect() cancels pending reconnect work and does not trigger further reconnect attempts after a manual shutdown', async () => {
    let { server, port } = await startServer()
    let api = makeApi({
      port,
      autoReconnect: true,
      reconnectDelay: 200,
      maxReconnectDelay: 1000,
    })

    await api.connect()

    // Register before terminating so the event is never missed.
    let closeSeen = new Promise<void>((resolve) => {
      let onClose = () => {
        api.removeEventListener('close', onClose)
        resolve()
      }
      api.addEventListener('close', onClose)
    })

    // Terminate from the server side to trigger the reconnect scheduling.
    server.clients.forEach((socket) => socket.terminate())

    // scheduleReconnect() runs synchronously inside the close handler, so the
    // count is guaranteed to be non-zero as soon as the close event resolves.
    await closeSeen
    expect(api.reconnectAttemptCount).toBe(1)

    // Manual disconnect cancels the timer and resets the count.
    await api.disconnect()
    expect(api.reconnectAttemptCount).toBe(0)

    // With reconnectDelay: 200 ms and ±20 % jitter the timer fires at most
    // 240 ms after scheduling. clearTimeout() is synchronous, so 350 ms is a
    // safe margin to detect a timer that was not properly cancelled.
    await wait(350)
    expect(api.reconnectAttemptCount).toBe(0)
    expect(api.isConnected).toBe(false)
  }, 5000)

  test('When autoReconnect is false, an unexpected close leaves the client disconnected without scheduling a retry', async () => {
    let { server, port } = await startServer()
    let api = makeApi({ port, autoReconnect: false })

    await api.connect()

    // Register before terminating so the event is never missed.
    let closeSeen = new Promise<void>((resolve) => {
      let onClose = () => {
        api.removeEventListener('close', onClose)
        resolve()
      }
      api.addEventListener('close', onClose)
    })

    server.clients.forEach((socket) => socket.terminate())

    // scheduleReconnect() returns immediately when autoReconnect is false, so
    // the state is final as soon as the close event has been delivered.
    await closeSeen
    expect(api.isConnected).toBe(false)
    expect(api.reconnectAttemptCount).toBe(0)
  }, 3000)

  test('Keepalive clears the pong timeout when a pong is received and terminates the socket when the pong deadline is missed', async () => {
    // Part A: a server that responds to pings should keep the connection alive.
    // If the pong timeout were not cleared on receipt, the socket would
    // terminate within the first keepalive cycle.
    let { port } = await startServer()
    let api = makeApi({
      port,
      autoReconnect: false,
      keepAliveInterval: 50,
      keepAliveTimeout: 100,
    })

    await api.connect()
    // Wait long enough to span several keepalive cycles (interval: 50 ms,
    // timeout: 100 ms). The socket would terminate at ~150 ms if the pong
    // timeout were not cleared on receipt, so 200 ms proves it is still alive.
    await wait(200)
    expect(api.isConnected).toBe(true)

    await api.disconnect()

    // Part B: a server that completes the WS handshake but discards all
    // frames (including pings) without responding should cause the client to
    // terminate the socket when the pong deadline expires.
    let { port: silentPort } = await startNoPongServer()

    let silentApi = makeApi({
      port: silentPort,
      autoReconnect: false,
      keepAliveInterval: 50,
      keepAliveTimeout: 50,
    })

    // Register before connecting so the close event is never missed.
    let silentClosed = new Promise<void>((resolve) => {
      let onClose = () => {
        silentApi.removeEventListener('close', onClose)
        resolve()
      }
      silentApi.addEventListener('close', onClose)
    })

    await silentApi.connect()
    // The socket terminates once keepAliveInterval + keepAliveTimeout elapses
    // without a pong. Await the close event directly rather than sleeping.
    await silentClosed
    expect(silentApi.isConnected).toBe(false)
  }, 5000)

  test('send() rejects while disconnected', async () => {
    let api = makeApi({ autoReconnect: false })
    await expect(api.send('hello')).rejects.toThrow(
      'WebSocket is not connected',
    )
  })

  test('send() resolves when the underlying send succeeds and rejects if data cannot be serialized', async () => {
    let { port } = await startServer()
    let api = makeApi({ port })
    await api.connect()

    await expect(api.send({ value: 42 })).resolves.toBeUndefined()

    // JSON.stringify throws on circular references, which the try/catch in
    // send() converts into a rejection.
    let circular: any = {}
    circular.self = circular
    await expect(api.send(circular)).rejects.toThrow()
  })

  test('Incoming string and buffer messages emit parsed JSON when possible and preserve the original raw payload', async () => {
    let { server, port } = await startServer()
    let api = makeApi({ port })
    let received: Array<{ data: unknown; raw: WebSocket.Data }> = []

    api.addEventListener('message', (event) => {
      received.push({ data: event.data, raw: event.raw })
    })

    await api.connect()

    let serverSocket = await new Promise<WebSocket>((resolve) => {
      if (server.clients.size > 0) {
        resolve([...server.clients][0])
        return
      }
      server.once('connection', (socket) => resolve(socket))
    })

    // All four messages are sent up-front and collected via a counter listener
    // that resolves once every expected message has arrived. This replaces four
    // sequential wait() calls with a single event-driven await, eliminating the
    // timing gap between each send/wait pair.
    let allReceived = new Promise<void>((resolve) => {
      let remaining = 4
      let onMessage = () => {
        if (--remaining === 0) {
          api.removeEventListener('message', onMessage)
          resolve()
        }
      }
      api.addEventListener('message', onMessage)
    })

    // 1. Valid JSON string → data is parsed object, raw is Buffer.
    serverSocket.send(JSON.stringify({ key: 'value' }))
    // 2. Non-JSON string → data stays as string, raw is Buffer.
    serverSocket.send('plain-text')
    // 3. Buffer with valid JSON → data is parsed object, raw is Buffer.
    serverSocket.send(Buffer.from(JSON.stringify({ buf: true })))
    // 4. Buffer with non-JSON → data is string, raw is Buffer.
    serverSocket.send(Buffer.from('not-json'))

    await allReceived

    expect(received).toHaveLength(4)

    // JSON string — ws 8.x delivers text frames as Buffer, not string.
    expect(received[0].data).toEqual({ key: 'value' })
    expect(Buffer.isBuffer(received[0].raw)).toBe(true)
    expect((received[0].raw as Buffer).toString()).toBe(
      JSON.stringify({ key: 'value' }),
    )

    // Non-JSON string — data stays as string, raw is the underlying Buffer.
    expect(received[1].data).toBe('plain-text')
    expect(Buffer.isBuffer(received[1].raw)).toBe(true)
    expect((received[1].raw as Buffer).toString()).toBe('plain-text')

    // Buffer with JSON — data is parsed, raw is the original Buffer.
    expect(received[2].data).toEqual({ buf: true })
    expect(Buffer.isBuffer(received[2].raw)).toBe(true)

    // Buffer with non-JSON — data is stringified, raw is the original Buffer.
    expect(received[3].data).toBe('not-json')
    expect(Buffer.isBuffer(received[3].raw)).toBe(true)
  }, 5000)

  test('fromConfig() constructs a client from provided options and throws on invalid options', () => {
    // port accepts numeric strings per the apiOptionsSchema union type.
    let api = WebSocketApi.fromConfig({
      protocol: 'ws',
      host: 'localhost',
      port: '9001',
      connectTimeout: 5000,
      autoReconnect: false,
    })
    expect(api).toBeInstanceOf(WebSocketApi)
    expect(api.url).toBe('ws://localhost:9001')
    expect(api.connectTimeout).toBe(5000)
    expect(api.autoReconnect).toBe(false)

    // connectTimeout below the schema minimum of 1000 ms should throw.
    expect(() =>
      WebSocketApi.fromConfig({
        connectTimeout: 500,
      }),
    ).toThrow('Invalid WebSocket API configuration')
  })
})
