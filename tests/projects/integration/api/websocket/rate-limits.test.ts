import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
} from '@jest/globals'
import type { MetisServer } from '@server/MetisServer'
import { ServerEmittedError } from '@shared/connect/errors/ServerEmittedError'
import type { Socket } from 'socket.io-client'
import { TestSocketClient } from 'tests/middleware/TestSocketClient'
import { TestSuiteSetup } from 'tests/middleware/TestSuiteSetup'
import { TestSuiteTeardown } from 'tests/middleware/TestSuiteTeardown'
import { TestToolbox } from 'tests/toolbox/TestToolbox'

describe('Rate limiting', () => {
  const USERNAME_PREFIX = 'test_ws_rate_limit'
  let socket: Socket | null = null
  let server: MetisServer
  let cookieHeader: string = ''

  /**
   * Sleeps for the specified duration.
   * @param ms Duration to sleep in milliseconds.
   */
  const sleep = async (ms: number): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Creates a new authenticated socket connection for the current test.
   * @resolves with a connected socket.
   * @rejects if the test user cannot be created, logged in, or connected.
   */
  const setupAuthenticatedSocket = async () => {
    const context = await TestSuiteSetup.createTestContext()
    server = context.server
    let client = context.client

    let { username, password } = await TestSuiteSetup.createTestUser({
      username: `${USERNAME_PREFIX}_${TestToolbox.generateRandomId()}`,
      password: TestToolbox.DEFAULT_PASSWORD,
      accessId: 'instructor',
    })

    let loginResponse = await client.post('/api/v1/logins/', {
      username,
      password,
    })
    expect(loginResponse.status).toBe(200)

    cookieHeader = TestSocketClient.buildCookieHeader(
      loginResponse.headers['set-cookie'],
    )
    expect(cookieHeader.length).toBeGreaterThan(0)

    socket = await TestSocketClient.connect(server, cookieHeader)
  }

  beforeEach(async () => {
    await setupAuthenticatedSocket()
  }, 20000)

  afterEach(() => {
    if (socket) {
      socket.disconnect()
      socket = null
    }
  })

  test('WebSocket: emits CODE_MESSAGE_RATE_LIMIT when user exceeds message rate (and resets the user web session)', async () => {
    if (!socket) {
      throw Error('Socket was not initialized by beforeEach.')
    }

    let wsRateLimit = Number(process.env.WS_RATE_LIMIT ?? 100)
    let wsRateLimitDurationSeconds = Number(
      process.env.WS_RATE_LIMIT_DURATION ?? 1,
    )
    let windowMs = Math.ceil(wsRateLimitDurationSeconds * 1000)

    // Avoid interference from previous test traffic.
    await sleep(windowMs + 250)

    let basePayload = {
      method: 'request-current-session',
      data: {},
    }

    // Burst valid events to exceed the configured limit.
    let messageCount = Math.max(wsRateLimit + 50, 150)
    for (let i = 0; i < messageCount; i++) {
      TestSocketClient.sendJson(socket, {
        ...basePayload,
        requestId: TestToolbox.generateRandomId(),
      })
    }

    let rateLimitEvent = await TestSocketClient.waitForError(
      socket,
      ({ code }) => code === ServerEmittedError.CODE_MESSAGE_RATE_LIMIT,
      5000,
    )

    expect(rateLimitEvent.code).toBe(ServerEmittedError.CODE_MESSAGE_RATE_LIMIT)

    // After the window resets, the web session should have been destroyed
    // and the user should no longer be authenticated.
    await sleep(windowMs + 250)

    // The socket should be disconnected.
    expect(socket.connected).toBe(false)

    // The connection attempt should be rejected due to unauthenticated session.
    try {
      await TestSocketClient.connect(server, cookieHeader)
      throw new Error(
        'Expected socket reconnect to fail after rate-limit reset.',
      )
    } catch (error: any) {
      let parsed: any
      try {
        parsed = JSON.parse(error?.message)
      } catch {
        throw error
      }

      expect(parsed?.code).toBe(ServerEmittedError.CODE_UNAUTHENTICATED)
    }
  }, 20000)

  afterAll(async () => {
    await TestSuiteTeardown.cleanupTestUsers(USERNAME_PREFIX)
  })
})
