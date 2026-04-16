import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from '@jest/globals'
import { ServerMissionFile } from '@server/missions/files/ServerMissionFile'
import { SessionServer } from '@server/sessions/SessionServer'
import type { TMissionFileJson } from '@shared/missions/files/MissionFile'
import { Types } from 'mongoose'
import type { TestHttpClient } from 'tests/helpers/TestHttpClient'
import { TestToolbox } from 'tests/helpers/TestToolbox'
import { TestSocketClient } from 'tests/helpers/TestSocketClient'
import { TestSuiteSetup } from 'tests/helpers/TestSuiteSetup'
import { TestSuiteTeardown } from 'tests/helpers/TestSuiteTeardown'

describe('/api/v1/sessions', () => {
  // Extract commonly used utilities.
  const { generateRandomId, DEFAULT_PASSWORD: defaultPassword } = TestToolbox
  const { createTestContext, createTestUser } = TestSuiteSetup
  const { cleanupTestMissions, cleanupTestUsers } = TestSuiteTeardown

  // Per-test variables.
  const suitePrefix = 'test_sessions'
  let username: string
  let password: string = defaultPassword
  let sessionIdsToCleanup: string[] = []
  let missionIdsToCleanup: string[] = []
  let suiteMissionId: string

  beforeEach(() => {
    username = `${suitePrefix}_${generateRandomId()}`
  })

  beforeAll(async () => {
    // Build a mission for this suite so we don't rely on or mutate
    // the seeded default mission.
    let { client } = await createTestContext()

    let bootstrapUsername = `${suitePrefix}_bootstrap_${generateRandomId()}`
    await createTestUser({
      username: bootstrapUsername,
      password,
      accessId: 'admin',
    })
    await loginUser(client, { username: bootstrapUsername, password })

    let missionsResponse = await client.get('/api/v1/missions/')
    expect(missionsResponse.status).toBe(200)
    expect(Array.isArray(missionsResponse.data)).toBe(true)
    expect(missionsResponse.data.length).toBeGreaterThan(0)

    let baseMissionId = missionsResponse.data[0]._id
    expect(typeof baseMissionId).toBe('string')

    let copyName = `${suitePrefix}_mission_${generateRandomId()}`
    let copyResponse = await client.post('/api/v1/missions/copy/', {
      originalId: baseMissionId,
      copyName,
    })
    expect(copyResponse.status).toBe(200)
    expect(copyResponse.data?._id).toBeDefined()
    suiteMissionId = copyResponse.data._id
    missionIdsToCleanup.push(suiteMissionId)
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

  function injectMissionFileIntoSession(
    sessionId: string,
    file: TMissionFileJson,
  ): void {
    let sessionServer = SessionServer.get(sessionId)
    expect(sessionServer).toBeTruthy()

    sessionServer!.mission.files.push(
      ServerMissionFile.fromJson(file, sessionServer!.mission),
    )
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

    let sessionName = `${suitePrefix}_session_${generateRandomId()}`

    let sessionId = await launchSession(client, suiteMissionId, sessionName)

    let listResponse = await client.get('/api/v1/sessions/')
    expect(listResponse.status).toBe(200)
    let found = listResponse.data.find(
      (session: any) => session._id === sessionId,
    )
    expect(found?.name).toBe(sessionName)
  })

  test('Rejects session launch for student access without session write', async () => {
    let { client } = await createTestContext()
    let lowPrivUser = `${suitePrefix}_student_${generateRandomId()}`
    await createTestUser({
      username: lowPrivUser,
      password,
      accessId: 'student',
    })

    await loginUser(client, { username: lowPrivUser, password })

    let response = await client.post('/api/v1/sessions/launch/', {
      missionId: suiteMissionId,
      name: `${suitePrefix}_no_perms`,
    })

    expect(response.status).toBe(403)
  })

  test('Allows owner deletion when native session write access applies', async () => {
    let { client } = await createTestContext()
    await createTestUser({ username, password })
    await loginUser(client, { username, password })

    let sessionId = await launchSession(
      client,
      suiteMissionId,
      `${suitePrefix}_delete_${generateRandomId()}`,
    )

    let deleteResponse = await client.delete(`/api/v1/sessions/${sessionId}/`)
    expect(deleteResponse.status).toBe(200)
  })

  test('Rejects deleting a session when requester is not the owner', async () => {
    let { client: ownerClient } = await createTestContext()
    let { client: foreignClient } = await createTestContext()

    let ownerUser = `${suitePrefix}_owner_${generateRandomId()}`
    let foreignUser = `${suitePrefix}_foreign_${generateRandomId()}`
    await createTestUser({ username: ownerUser, password })
    await createTestUser({ username: foreignUser, password })

    await loginUser(ownerClient, { username: ownerUser, password })
    await loginUser(foreignClient, { username: foreignUser, password })

    let sessionId = await launchSession(
      ownerClient,
      suiteMissionId,
      `${suitePrefix}_owned_${generateRandomId()}`,
    )

    let response = await foreignClient.delete(`/api/v1/sessions/${sessionId}/`)

    expect(response.status).toBe(401)

    // Cleanup with owner.
    let ownerDelete = await ownerClient.delete(`/api/v1/sessions/${sessionId}/`)
    expect(ownerDelete.status).toBe(200)
    sessionIdsToCleanup = sessionIdsToCleanup.filter((id) => id !== sessionId)
  })

  test('GET /api/v1/sessions/files/:_id/download requires auth', async () => {
    let { client } = await createTestContext()

    let response = await client.get('/api/v1/sessions/files/some-file/download')
    expect(response.status).toBe(401)
  })

  test('GET /api/v1/sessions/files/:_id/download requires in-session auth, 404s for missing, and 403s without access', async () => {
    // Create client-server context.
    let { server, client: ownerClient } = await createTestContext()
    let { client: studentClient } = await createTestContext()

    // Create session owner user.
    let ownerCreateResult = await createTestUser({ username, password })
    let ownerUsername = ownerCreateResult.username
    let ownerPassword = ownerCreateResult.password ?? password

    // Login owner user.
    await loginUser(ownerClient, {
      username: ownerUsername,
      password: ownerPassword,
    })

    // Create student user.
    let studentCreateResult = await createTestUser({
      username: `${suitePrefix}_student_${generateRandomId()}`,
      password,
      accessId: 'student',
    })
    let studentUsername = studentCreateResult.username
    let studentPassword = studentCreateResult.password ?? password

    // Launch session.
    let sessionId = await launchSession(
      ownerClient,
      suiteMissionId,
      `${suitePrefix}_file_dl_${generateRandomId()}`,
    )

    // Inject a mission file into the session.
    let missionFileId = new Types.ObjectId().toHexString()
    let missionFileJson: TMissionFileJson = {
      _id: missionFileId,
      alias: `${suitePrefix}_file_${generateRandomId()}.txt`,
      lastKnownName: `${suitePrefix}_file_${generateRandomId()}.txt`,
      initialAccess: [],
      reference: new Types.ObjectId().toHexString(),
    }
    injectMissionFileIntoSession(sessionId, missionFileJson)

    // Login student and connect to session socket.
    let studentLoginResponse = await studentClient.post('/api/v1/logins/', {
      username: studentUsername,
      password: studentPassword,
    })
    expect(studentLoginResponse.status).toBe(200)
    let cookieHeader = TestSocketClient.buildCookieHeader(
      studentLoginResponse.headers['set-cookie'],
    )

    // Connect to session socket.
    let socket = await TestSocketClient.connect(server, cookieHeader)
    try {
      // Join the session.
      await TestSocketClient.joinSession(socket, sessionId)

      // Attempt to download missing file.
      let missing = await studentClient.get(
        `/api/v1/sessions/files/${new Types.ObjectId().toHexString()}/download`,
      )
      expect(missing.status).toBe(404)

      // Attempt to download existing file without access.
      let forbidden = await studentClient.get(
        `/api/v1/sessions/files/${missionFileId}/download`,
      )
      expect(forbidden.status).toBe(403)
    } finally {
      socket.disconnect()
    }
  })

  afterAll(async () => {
    // Best-effort cleanup of any sessions that weren't deleted during tests.
    if (sessionIdsToCleanup.length > 0) {
      // Use admin user to delete sessions.
      let { client } = await createTestContext()
      const username = `${suitePrefix}_cleanup_${generateRandomId()}`
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
    await cleanupTestUsers(suitePrefix)

    // Cleanup test missions.
    if (missionIdsToCleanup.length > 0) {
      let { client } = await createTestContext()
      let username = `${suitePrefix}_mission_cleanup_${generateRandomId()}`
      let password = defaultPassword
      await createTestUser({ username, password, accessId: 'admin' })
      await loginUser(client, { username, password })
      await cleanupTestMissions(suitePrefix)
    }
  })
})
