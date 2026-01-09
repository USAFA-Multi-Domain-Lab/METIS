import type { MetisServer } from '@metis/server/MetisServer'
import { io, type Socket } from 'socket.io-client'
import { TestToolbox } from 'tests/toolbox/TestToolbox'

/**
 * Socket.io client utilities for integration tests.
 */
export abstract class TestSocketClient {
  /**
   * Builds a Cookie header from the Set-Cookie array on an HTTP response.
   * @param setCookieHeader The Set-Cookie header values returned by an HTTP response.
   * @returns A single Cookie header string suitable for socket.io extraHeaders.
   */
  public static buildCookieHeader(setCookieHeader?: string[]): string {
    if (!setCookieHeader) return ''

    return setCookieHeader
      .map((entry) => entry.split(';')[0])
      .filter((entry) => Boolean(entry))
      .join('; ')
  }

  /**
   * Connects a socket.io client to the METIS server.
   * @param server The running METIS server instance.
   * @param cookieHeader Cookie header value containing the authenticated session.
   * @param timeoutMs Optional timeout for connection (uses socket.io built-in timeout handling).
   * @returns A connected socket.
   */
  public static async connect(
    server: MetisServer,
    cookieHeader: string,
    timeoutMs: number = 3000,
  ): Promise<Socket> {
    let address = server.httpServer.address()
    let port =
      typeof address === 'object' && address ? address.port : server.port

    let socket = io(`http://127.0.0.1:${port}`, {
      extraHeaders: { Cookie: cookieHeader },
      forceNew: true,
      reconnection: false,
      transports: ['websocket'],
      timeout: timeoutMs,
    })

    await new Promise<void>((resolve, reject) => {
      let handleConnect = () => {
        socket.off('connect_error', handleError)
        resolve()
      }
      let handleError = (error: Error) => {
        socket.off('connect', handleConnect)
        reject(error)
      }
      socket.once('connect', handleConnect)
      socket.once('connect_error', handleError)
    })

    return socket
  }

  /**
   * Joins a session using an already-connected socket.io client.
   * @param socket Connected socket instance.
   * @param sessionId The session ID to join.
   * @param timeoutMs Optional timeout for join completion.
   */
  public static async joinSession(
    socket: Socket,
    sessionId: string,
    timeoutMs: number = 3000,
  ): Promise<void> {
    let joinPayload = {
      method: 'request-join-session',
      data: { sessionId },
      requestId: TestToolbox.generateRandomId(),
    }

    socket.send(JSON.stringify(joinPayload))

    await new Promise<void>((resolve, reject) => {
      let cleanedUp = false
      let cleanup = () => {
        if (cleanedUp) return
        cleanedUp = true
        clearTimeout(timer)
        socket.off('message', handleMessage)
        socket.off('connect_error', handleError)
      }

      let timer = setTimeout(() => {
        cleanup()
        reject(new Error('session join timeout'))
      }, timeoutMs)

      let handleMessage = (raw: string | object) => {
        try {
          let event = typeof raw === 'string' ? JSON.parse(raw) : raw
          if ((event as any).method === 'session-joined') {
            cleanup()
            resolve()
          }
          if ((event as any).method === 'error') {
            cleanup()
            reject(new Error((event as any).code ?? 'socket error'))
          }
        } catch (error) {
          cleanup()
          reject(error as Error)
        }
      }

      let handleError = (error: Error) => {
        cleanup()
        reject(error)
      }

      socket.on('message', handleMessage)
      socket.once('connect_error', handleError)
    })
  }

  /**
   * Sends a JSON payload over the socket using the METIS wire format.
   * @param socket Connected socket instance.
   * @param payload JSON-serializable payload to send.
   */
  public static sendJson(socket: Socket, payload: unknown): void {
    socket.send(JSON.stringify(payload))
  }

  /**
   * Waits for the next socket message matching a predicate.
   * @param socket Connected socket instance.
   * @param predicate Predicate to identify the expected event.
   * @param timeoutMs Timeout in milliseconds.
   * @resolves with the matched event.
   * @rejects if the timeout elapses or JSON parsing fails.
   */
  public static async waitForEvent<TEvent = any>(
    socket: Socket,
    predicate: (event: any) => boolean,
    timeoutMs: number = 5000,
  ): Promise<TEvent> {
    return await new Promise<TEvent>((resolve, reject) => {
      let cleanedUp = false
      let cleanup = () => {
        if (cleanedUp) return
        cleanedUp = true
        clearTimeout(timer)
        socket.off('message', onMessage)
      }

      let timer = setTimeout(() => {
        cleanup()
        reject(new Error('socket event wait timeout'))
      }, timeoutMs)

      let onMessage = (raw: string | object) => {
        try {
          let event = typeof raw === 'string' ? JSON.parse(raw) : raw
          if (predicate(event)) {
            cleanup()
            resolve(event as TEvent)
          }
        } catch (error) {
          cleanup()
          reject(error)
        }
      }

      socket.on('message', onMessage)
    })
  }

  /**
   * Waits for a METIS error event.
   * @param socket Connected socket instance.
   * @param predicate Optional predicate for matching the error payload.
   * @param timeoutMs Timeout in milliseconds.
   * @resolves with the matched error event.
   * @rejects if the timeout elapses or JSON parsing fails.
   */
  public static async waitForError(
    socket: Socket,
    predicate: ((event: any) => boolean) | undefined = undefined,
    timeoutMs: number = 5000,
  ): Promise<any> {
    return await this.waitForEvent(
      socket,
      (event) =>
        (event as any).method === 'error' &&
        (predicate ? predicate(event) : true),
      timeoutMs,
    )
  }
}
