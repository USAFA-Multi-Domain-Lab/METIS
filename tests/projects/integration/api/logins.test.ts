import { afterAll, beforeEach, describe, expect, test } from '@jest/globals'
import { ServerLogin } from '@metis/server/logins/ServerLogin'
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

  beforeEach(() => {
    // Unique username per test to avoid cross-test contamination.
    username = `${usernamePrefix}_${generateRandomId()}`
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

  test('Rejects login when user is in timeout', async () => {
    let { client } = await createTestContext()
    let { user } = await createTestUser({ username, password })

    await client.post('/api/v1/logins/', { username, password })

    let timeoutEnd = Date.now() + 5000
    ServerLogin.timeout(user._id, timeoutEnd)

    await client.delete('/api/v1/logins/')

    let secondLogin = await client.post('/api/v1/logins/', {
      username,
      password,
    })

    expect(secondLogin.status).toBe(403)
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

  afterAll(async () => {
    await cleanupTestUsers(usernamePrefix)
  })
})
