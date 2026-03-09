import type { jest } from '@jest/globals'
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
} from '@jest/globals'
import { UserModel } from '@metis/server/database/models/users'
import { TestSuiteSetup } from 'tests/middleware/TestSuiteSetup'
import { TestSuiteTeardown } from 'tests/middleware/TestSuiteTeardown'
import { TestToolbox } from 'tests/toolbox/TestToolbox'

/**
 * Integration tests for /api/v1/logins/ covering login, status, and logout flows.
 */
describe('/api/v1/logins', () => {
  // Extract commonly used utilities.
  const { generateRandomId, DEFAULT_PASSWORD: defaultPassword } = TestToolbox
  const { createTestContext, createTestUser } = TestSuiteSetup
  const { cleanupTestUsers } = TestSuiteTeardown

  // Per-test variables.
  let username: string
  let password: string = defaultPassword
  const usernamePrefix = 'test_logins'

  /**
   * Spy for `Date.now` used to mock time in timeout-related tests.
   * Restored automatically in `afterEach`.
   */
  let dateNowSpy: jest.SpiedFunction<typeof Date.now> | null = null

  beforeEach(() => {
    // Unique username per test to avoid cross-test contamination.
    username = `${usernamePrefix}_${generateRandomId()}`
  })

  afterEach(() => {
    // Restore Date.now if it was mocked during the test.
    if (dateNowSpy) {
      dateNowSpy.mockRestore()
      dateNowSpy = null
    }
  })

  test('Rejects login when username is missing', async () => {
    let { client } = await createTestContext()

    let response = await client.post('/api/v1/logins/', {
      password,
    })

    expect(response.status).toBe(400)
  })

  test('Rejects login when password is missing', async () => {
    let { client } = await createTestContext()

    let response = await client.post('/api/v1/logins/', {
      username,
    })

    expect(response.status).toBe(400)
  })

  test('Rejects duplicate login from same client without logout', async () => {
    let { client } = await createTestContext()
    await createTestUser({ username, password })

    let first = await client.post('/api/v1/logins/', { username, password })
    expect(first.status).toBe(200)

    let second = await client.post('/api/v1/logins/', { username, password })
    expect(second.status).toBe(409)
  })

  test('Logs in with valid credentials and receives session cookie', async () => {
    let { client } = await createTestContext()
    await createTestUser({ username, password })

    let loginResponse = await client.post('/api/v1/logins/', {
      username,
      password,
    })

    expect(loginResponse.status).toBe(200)
    expect(Array.isArray(loginResponse.headers['set-cookie'])).toBe(true)
    expect(loginResponse.data.login.user.username).toBe(username)

    // Subsequent authenticated call should see current login.
    let getResponse = await client.get('/api/v1/logins/')
    expect(getResponse.data.user.username).toBe(username)
    expect(getResponse.status).toBe(200)
  })

  test('Session cookie is HttpOnly', async () => {
    let { client } = await createTestContext()
    await createTestUser({ username, password })

    let loginResponse = await client.post('/api/v1/logins/', {
      username,
      password,
    })

    expect(loginResponse.status).toBe(200)
    let setCookie = loginResponse.headers['set-cookie']
    expect(Array.isArray(setCookie)).toBe(true)
    expect(setCookie?.some((cookie) => cookie.includes('HttpOnly'))).toBe(true)
  })

  test('Rejects login with incorrect password', async () => {
    let { client } = await createTestContext()
    await createTestUser({ username, password })

    let response = await client.post('/api/v1/logins/', {
      username,
      password: 'wrongpass',
    })

    expect(response.status).toBe(401)
  })

  test('Returns null login via GET when not authenticated', async () => {
    let { client } = await createTestContext()

    let response = await client.get('/api/v1/logins/')

    expect(response.status).toBe(200)
    expect(response.data).toBeNull()
  })

  test('Logs out and clears session cookie', async () => {
    let { client } = await createTestContext()
    await createTestUser({ username, password })

    await client.post('/api/v1/logins/', { username, password })

    let logoutResponse = await client.delete('/api/v1/logins/')
    expect(logoutResponse.status).toBe(200)

    // After logout, the same client should see null login.
    let getResponse = await client.get('/api/v1/logins/')
    expect(getResponse.status).toBe(200)
    expect(getResponse.data).toBeNull()
  })

  test('Returns 400 when logging out without a login', async () => {
    let { client } = await createTestContext()

    let response = await client.delete('/api/v1/logins/')

    expect(response.status).toBe(400)
  })

  test('Forceful logout disconnects current session', async () => {
    let { client } = await createTestContext()
    await createTestUser({ username, password })

    await client.post('/api/v1/logins/', { username, password })

    let response = await client.delete('/api/v1/logins/', {
      headers: { forceful: 'true' },
    })

    expect(response.status).toBe(200)

    let getResponse = await client.get('/api/v1/logins/')
    expect(getResponse.status).toBe(200)
    expect(getResponse.data).toBeNull()
  })

  test('After forceful login, previous session sees null login', async () => {
    let { client: firstClient } = await createTestContext()
    let { client: secondClient } = await createTestContext()
    await createTestUser({ username, password })

    await firstClient.post('/api/v1/logins/', { username, password })

    await secondClient.post(
      '/api/v1/logins/',
      { username, password },
      { headers: { forceful: 'true' } },
    )

    let firstGet = await firstClient.get('/api/v1/logins/')
    expect(firstGet.status).toBe(200)
    expect(firstGet.data).toBeNull()
  })

  test('Forceful login should evict prior session data', async () => {
    let { client: firstClient } = await createTestContext()
    let { client: secondClient } = await createTestContext()
    await createTestUser({ username, password })

    await firstClient.post('/api/v1/logins/', { username, password })

    await secondClient.post(
      '/api/v1/logins/',
      { username, password },
      { headers: { forceful: 'true' } },
    )

    let firstGet = await firstClient.get('/api/v1/logins/')
    expect(firstGet.status).toBe(200)
    expect(firstGet.data).toBeNull()
  })

  test('Rejects login with incorrect username', async () => {
    let { client } = await createTestContext()

    let response = await client.post('/api/v1/logins/', {
      username: 'nonexistent_user',
      password,
    })

    expect(response.status).toBe(401)
  })

  test('Rejects concurrent login without forceful flag', async () => {
    let { client } = await createTestContext()
    let { client: secondClient } = await createTestContext()
    await createTestUser({ username, password })

    await client.post('/api/v1/logins/', { username, password })

    let secondLogin = await secondClient.post('/api/v1/logins/', {
      username,
      password,
    })

    expect(secondLogin.status).toBe(409)
  })

  test('Rejects login for system users', async () => {
    let { client } = await createTestContext()
    let systemUsername = `${usernamePrefix}_system_${generateRandomId()}`

    await createTestUser({
      username: systemUsername,
      accessId: 'system',
      firstName: 'System',
      lastName: 'User',
    })

    let response = await client.post('/api/v1/logins/', {
      username: systemUsername,
      password: 'irrelevant',
    })

    expect(response.status).toBe(400)
  })

  test('Allows forceful login to replace existing session', async () => {
    let { client } = await createTestContext()
    let { client: secondClient } = await createTestContext()
    await createTestUser({ username, password })

    await client.post('/api/v1/logins/', { username, password })

    let forcefulLogin = await secondClient.post(
      '/api/v1/logins/',
      { username, password },
      { headers: { forceful: 'true' } },
    )

    expect(forcefulLogin.status).toBe(200)
    expect(forcefulLogin.data?.login?.user?.username).toBe(username)

    let getResponse = await secondClient.get('/api/v1/logins/')
    expect(getResponse.status).toBe(200)
    expect(getResponse.data.user.username).toBe(username)
  })

  test('Locks account after maximum failed login attempts', async () => {
    let { client } = await createTestContext()
    let lockoutUsername = `${usernamePrefix}_lockout_${generateRandomId()}`
    await createTestUser({ username: lockoutUsername, password })

    // Make 4 failed login attempts
    for (let i = 0; i < 4; i++) {
      let response = await client.post('/api/v1/logins/', {
        username: lockoutUsername,
        password: 'wrongpassword',
      })
      expect(response.status).toBe(401)
    }

    // 5th attempt triggers lockout (MAX_LOGIN_ATTEMPTS=5)
    let lockedResponse = await client.post('/api/v1/logins/', {
      username: lockoutUsername,
      password: 'wrongpassword',
    })

    expect(lockedResponse.status).toBe(403)
    expect(lockedResponse.data.error.message).toContain(
      'Too many failed login attempts',
    )
    expect(lockedResponse.data.error.message).toContain('locked')
  })

  test('Prevents login with correct password when account is locked', async () => {
    let { client } = await createTestContext()
    let lockoutUsername = `${usernamePrefix}_lockout_${generateRandomId()}`
    await createTestUser({ username: lockoutUsername, password })

    // Trigger lockout with failed attempts
    for (let i = 0; i < 5; i++) {
      await client.post('/api/v1/logins/', {
        username: lockoutUsername,
        password: 'wrongpassword',
      })
    }

    // Try with correct password - should still be locked
    let response = await client.post('/api/v1/logins/', {
      username: lockoutUsername,
      password,
    })

    expect(response.status).toBe(403)
    expect(response.data.error.message).toContain('locked')
  })

  test('Returns remaining lockout time in error message', async () => {
    let { client } = await createTestContext()
    let lockoutUsername = `${usernamePrefix}_lockout_${generateRandomId()}`
    await createTestUser({ username: lockoutUsername, password })

    // Trigger lockout
    for (let i = 0; i < 5; i++) {
      await client.post('/api/v1/logins/', {
        username: lockoutUsername,
        password: 'wrongpassword',
      })
    }

    let response = await client.post('/api/v1/logins/', {
      username: lockoutUsername,
      password,
    })

    expect(response.status).toBe(403)
    expect(response.data.error.message).toMatch(/\d+ minute\(s\)/)
  })

  test('Resets failed attempts counter after successful login', async () => {
    let { client } = await createTestContext()
    let lockoutUsername = `${usernamePrefix}_lockout_${generateRandomId()}`
    await createTestUser({ username: lockoutUsername, password })

    // Make 3 failed attempts
    for (let i = 0; i < 3; i++) {
      let response = await client.post('/api/v1/logins/', {
        username: lockoutUsername,
        password: 'wrongpassword',
      })
      expect(response.status).toBe(401)
    }

    // Successful login should reset counter
    let successResponse = await client.post('/api/v1/logins/', {
      username: lockoutUsername,
      password,
    })
    expect(successResponse.status).toBe(200)

    // Logout
    await client.delete('/api/v1/logins/')

    // Should be able to make 4 more failed attempts before lockout
    for (let i = 0; i < 4; i++) {
      let response = await client.post('/api/v1/logins/', {
        username: lockoutUsername,
        password: 'wrongpassword',
      })
      expect(response.status).toBe(401)
    }

    // 5th attempt locks the account
    let lockedResponse = await client.post('/api/v1/logins/', {
      username: lockoutUsername,
      password: 'wrongpassword',
    })
    expect(lockedResponse.status).toBe(403)
  })

  test('Different clients trigger same lockout for same user', async () => {
    let { client: firstClient } = await createTestContext()
    let { client: secondClient } = await createTestContext()
    let lockoutUsername = `${usernamePrefix}_lockout_${generateRandomId()}`
    await createTestUser({ username: lockoutUsername, password })

    // First client makes 3 failed attempts
    for (let i = 0; i < 3; i++) {
      await firstClient.post('/api/v1/logins/', {
        username: lockoutUsername,
        password: 'wrongpassword',
      })
    }

    // Second client makes 2 more failed attempts (5th triggers lockout)
    for (let i = 0; i < 2; i++) {
      await secondClient.post('/api/v1/logins/', {
        username: lockoutUsername,
        password: 'wrongpassword',
      })
    }

    // Both clients should see lockout
    let firstResponse = await firstClient.post('/api/v1/logins/', {
      username: lockoutUsername,
      password,
    })
    expect(firstResponse.status).toBe(403)

    let secondResponse = await secondClient.post('/api/v1/logins/', {
      username: lockoutUsername,
      password,
    })
    expect(secondResponse.status).toBe(403)
  })

  test('Lockout only affects specific user account', async () => {
    let { client } = await createTestContext()
    let lockoutUsername = `${usernamePrefix}_lockout_${generateRandomId()}`
    let secondUsername = `${usernamePrefix}_lockout_${generateRandomId()}`
    await createTestUser({ username: lockoutUsername, password })
    await createTestUser({ username: secondUsername, password })

    // Lock first account (5 failed attempts)
    for (let i = 0; i < 5; i++) {
      await client.post('/api/v1/logins/', {
        username: lockoutUsername,
        password: 'wrongpassword',
      })
    }

    // First account should be locked
    let firstResponse = await client.post('/api/v1/logins/', {
      username: lockoutUsername,
      password,
    })
    expect(firstResponse.status).toBe(403)

    // Second account should still work
    let secondResponse = await client.post('/api/v1/logins/', {
      username: secondUsername,
      password,
    })
    expect(secondResponse.status).toBe(200)
  })

  test('Allows login after lockout period expires', async () => {
    let { client } = await createTestContext()
    let lockoutUsername = `${usernamePrefix}_lockout_${generateRandomId()}`
    let { user } = await createTestUser({
      username: lockoutUsername,
      password,
    })

    // Trigger lockout with 5 failed attempts
    for (let i = 0; i < 5; i++) {
      await client.post('/api/v1/logins/', {
        username: lockoutUsername,
        password: 'wrongpassword',
      })
    }

    // Verify account is locked
    let lockedResponse = await client.post('/api/v1/logins/', {
      username: lockoutUsername,
      password,
    })
    expect(lockedResponse.status).toBe(403)

    // Manually expire the lockout by setting loginLockedUntil to current time
    await UserModel.findByIdAndUpdate(
      user._id,
      {
        loginLockedUntil: new Date(),
      },
      { includeSensitive: true },
    )

    // Login with correct credentials should now succeed
    let loginResponse = await client.post('/api/v1/logins/', {
      username: lockoutUsername,
      password,
    })
    expect(loginResponse.status).toBe(200)

    // Verify lockout fields were reset
    let userDoc = await UserModel.findById(
      user._id,
      {},
      { includeSensitive: true },
    )
    expect(userDoc?.failedLoginAttempts).toBe(0)
    expect(userDoc?.loginLockedUntil).toBeNull()
    expect(userDoc?.lastFailedLoginAt).toBeNull()
  })

  afterAll(async () => {
    await cleanupTestUsers(usernamePrefix)
  })
})
