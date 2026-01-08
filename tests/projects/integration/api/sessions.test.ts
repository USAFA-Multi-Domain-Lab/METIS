import { afterAll, beforeEach, describe, expect, test } from '@jest/globals'
import { Types } from 'mongoose'
import type { TestHttpClient } from 'tests/middleware/TestHttpClient'
import { TestSocketClient } from 'tests/middleware/TestSocketClient'
import { TestSuiteSetup } from 'tests/middleware/TestSuiteSetup'
import { TestSuiteTeardown } from 'tests/middleware/TestSuiteTeardown'
import { TestToolbox } from 'tests/toolbox/TestToolbox'

describe('/api/v1/sessions', () => {
  // Extract commonly used utilities.
  const { generateRandomId, DEFAULT_PASSWORD: defaultPassword } = TestToolbox
  const { createTestContext, createTestUser } = TestSuiteSetup
  const { cleanupTestUsers } = TestSuiteTeardown

  // Per-test variables.
  const usernamePrefix = 'test_sessions'
  let username: string
  let password: string = defaultPassword
  let sessionIdsToCleanup: string[] = []

  beforeEach(() => {
    username = `${usernamePrefix}_${generateRandomId()}`
  })

  async function loginUser(
    client: TestHttpClient,
    creds: {
      username: string
      password: string
    },
  ): Promise<void> {
    let response = await client.post('/api/v1/logins/', creds)
    expect(response.status).toBe(200)
  }

  async function fetchDefaultMissionId(
    client: TestHttpClient,
  ): Promise<string> {
    let response = await client.get('/api/v1/missions/')
    expect(response.status).toBe(200)
    expect(Array.isArray(response.data)).toBe(true)
    let mission = response.data[0]
    expect(mission?._id).toBeDefined()
    return mission._id
  }

  async function launchSession(
    client: TestHttpClient,
    missionId: string,
    name: string,
  ): Promise<string> {
    let response = await client.post('/api/v1/sessions/launch/', {
      missionId,
      name,
    })
    expect(response.status).toBe(200)
    expect(typeof response.data.sessionId).toBe('string')
    sessionIdsToCleanup.push(response.data.sessionId)
    return response.data.sessionId
  }

  test('Requires auth to list sessions', async () => {
    let { client } = await createTestContext()

    let response = await client.get('/api/v1/sessions/')

    expect(response.status).toBe(401)
  })

  test('Requires auth to launch a session', async () => {
    let { client } = await createTestContext()

    let response = await client.post('/api/v1/sessions/launch/', {
      missionId: new Types.ObjectId().toHexString(),
    })

    expect(response.status).toBe(401)
  })

  test('Returns empty list for authenticated user when no sessions exist', async () => {
    let { client } = await createTestContext()
    await createTestUser({ username, password })

    await client.post('/api/v1/logins/', { username, password })

    let response = await client.get('/api/v1/sessions/')

    expect(response.status).toBe(200)
    expect(Array.isArray(response.data)).toBe(true)
    expect(response.data.length).toBe(0)
  })

  test('Rejects session launch without missionId', async () => {
    let { client } = await createTestContext()
    await createTestUser({ username, password })

    await client.post('/api/v1/logins/', { username, password })

    let response = await client.post('/api/v1/sessions/launch/', {})

    expect(response.status).toBe(400)
  })

  test('Rejects session launch when mission is missing', async () => {
    let { client } = await createTestContext()
    await createTestUser({ username, password })

    await loginUser(client, { username, password })

    let response = await client.post('/api/v1/sessions/launch/', {
      missionId: new Types.ObjectId().toHexString(),
      name: 'Test Session',
    })

    expect(response.status).toBe(404)
  })

  test('Requires auth to delete session', async () => {
    let { client } = await createTestContext()

    let response = await client.delete('/api/v1/sessions/12345/')

    expect(response.status).toBe(401)
  })

  test('Returns 404 when deleting non-existent session with auth', async () => {
    let { client } = await createTestContext()
    await createTestUser({ username, password })

    await loginUser(client, { username, password })

    let response = await client.delete(
      `/api/v1/sessions/${new Types.ObjectId().toHexString()}/`,
    )

    expect(response.status).toBe(404)
  })

  test('Launches a session and lists it', async () => {
    let { client } = await createTestContext()
    await createTestUser({ username, password })
    await loginUser(client, { username, password })

    let missionId = await fetchDefaultMissionId(client)
    let sessionName = `${usernamePrefix}_session_${generateRandomId()}`

    let sessionId = await launchSession(client, missionId, sessionName)

    let listResponse = await client.get('/api/v1/sessions/')
    expect(listResponse.status).toBe(200)
    let found = listResponse.data.find(
      (session: any) => session._id === sessionId,
    )
    expect(found?.name).toBe(sessionName)
  })

  test('Rejects session launch for student access without session write', async () => {
    let { client } = await createTestContext()
    let lowPrivUser = `${usernamePrefix}_student_${generateRandomId()}`
    await createTestUser({
      username: lowPrivUser,
      password,
      accessId: 'student',
    })

    await loginUser(client, { username: lowPrivUser, password })

    // Use a valid mission id from a privileged context to isolate permission failure.
    let { client: privilegedClient } = await createTestContext()
    await createTestUser({ username, password })
    await loginUser(privilegedClient, { username, password })
    let missionId = await fetchDefaultMissionId(privilegedClient)

    let response = await client.post('/api/v1/sessions/launch/', {
      missionId,
      name: `${usernamePrefix}_no_perms`,
    })

    expect(response.status).toBe(403)
  })

  test('Allows owner deletion when native session write access applies', async () => {
    let { client } = await createTestContext()
    await createTestUser({ username, password })
    await loginUser(client, { username, password })

    let missionId = await fetchDefaultMissionId(client)
    let sessionId = await launchSession(
      client,
      missionId,
      `${usernamePrefix}_delete_${generateRandomId()}`,
    )

    let deleteResponse = await client.delete(`/api/v1/sessions/${sessionId}/`)
    expect(deleteResponse.status).toBe(200)
  })

  test('Rejects deleting a session when requester is not the owner', async () => {
    let { client: ownerClient } = await createTestContext()
    let { client: foreignClient } = await createTestContext()

    let ownerUser = `${usernamePrefix}_owner_${generateRandomId()}`
    let foreignUser = `${usernamePrefix}_foreign_${generateRandomId()}`
    await createTestUser({ username: ownerUser, password })
    await createTestUser({ username: foreignUser, password })

    await loginUser(ownerClient, { username: ownerUser, password })
    await loginUser(foreignClient, { username: foreignUser, password })

    let missionId = await fetchDefaultMissionId(ownerClient)
    let sessionId = await launchSession(
      ownerClient,
      missionId,
      `${usernamePrefix}_owned_${generateRandomId()}`,
    )

    let response = await foreignClient.delete(`/api/v1/sessions/${sessionId}/`)

    expect(response.status).toBe(401)

    // Cleanup with owner.
    let ownerDelete = await ownerClient.delete(`/api/v1/sessions/${sessionId}/`)
    expect(ownerDelete.status).toBe(200)
    sessionIdsToCleanup = sessionIdsToCleanup.filter((id) => id !== sessionId)
  })

  test('GET /api/v1/sessions/files/:_id/download requires in-session auth and 404s for unknown file', async () => {
    let { server, client } = await createTestContext()
    let { username: createdUsername, password: userPassword } =
      await createTestUser({ username, password })

    // Not logged in -> 401
    let unauth = await client.get('/api/v1/sessions/files/some-file/download')
    expect(unauth.status).toBe(401)

    // Login and launch session
    let loginResponse = await client.post('/api/v1/logins/', {
      username: createdUsername,
      password: userPassword,
    })
    let cookieHeader = TestSocketClient.buildCookieHeader(
      loginResponse.headers['set-cookie'],
    )
    let missionId = await fetchDefaultMissionId(client)
    let launch = await client.post('/api/v1/sessions/launch/', {
      missionId,
      name: `${usernamePrefix}_file_dl_${generateRandomId()}`,
    })
    expect(launch.status).toBe(200)

    // Cache sessionId for cleanup
    let sessionId = launch.data.sessionId
    sessionIdsToCleanup.push(sessionId)

    // Join via socket to satisfy in-session auth with a real member
    let socket = await TestSocketClient.connect(server, cookieHeader)
    await TestSocketClient.joinSession(socket, sessionId)

    let missing = await client.get(
      `/api/v1/sessions/files/${new Types.ObjectId().toHexString()}/download`,
    )
    expect(missing.status).toBe(404)

    socket.disconnect()
  })

  afterAll(async () => {
    // Best-effort cleanup of any sessions that weren't deleted during tests.
    if (sessionIdsToCleanup.length > 0) {
      // Use admin user to delete sessions.
      let { client } = await createTestContext()
      const username = `${usernamePrefix}_cleanup_${generateRandomId()}`
      const password = defaultPassword
      await createTestUser({ username, password, accessId: 'admin' })
      await loginUser(client, { username, password })

      // Delete each session.
      for (let sessionId of sessionIdsToCleanup) {
        await client.delete(`/api/v1/sessions/${sessionId}/`)
      }

      let sessions = await client.get('/api/v1/sessions/')
      expect(sessions.data.length).toBe(0)
    }

    // Cleanup test users.
    await cleanupTestUsers(usernamePrefix)
  })
})
