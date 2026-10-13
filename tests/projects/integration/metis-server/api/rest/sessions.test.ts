import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from '@jest/globals'
import { ServerMissionFile } from '@server/missions/files/ServerMissionFile'
import type { ServerSessionMember } from '@server/sessions/ServerSessionMember'
import type { SessionServer } from '@server/sessions/SessionServer'
import { ServerEnvironmentTask } from '@server/target-environments/ServerEnvironmentTask'
import { ServerTargetEnvironment } from '@server/target-environments/ServerTargetEnvironment'
import type { TMissionFileJson } from '@shared/missions/files/MissionFile'
import { Types } from 'mongoose'
import { createMissionPayload } from 'tests/helpers/projects/integration/rest-api/missions/payload'
import { launchPlayableSession } from 'tests/helpers/session/scenarios'
import type { TestHttpClient } from 'tests/helpers/TestHttpClient'
import { TestSession } from 'tests/helpers/TestSession'
import { TestSuiteSetup } from 'tests/helpers/TestSuiteSetup'
import { TestToolbox } from 'tests/helpers/TestToolbox'

describe('/api/v1/sessions', () => {
  // Extract commonly used utilities.
  const { generateRandomId, DEFAULT_PASSWORD: defaultPassword } = TestToolbox
  const { createTestContext, createTestUser } = TestSuiteSetup

  // Per-test variables.
  const suitePrefix = 'test_sessions'
  let username: string
  let password: string = defaultPassword
  let sessionIdsToCleanup: string[] = []
  let suiteMissionId: string

  beforeEach(() => {
    username = `${suitePrefix}_${generateRandomId()}`
  })

  afterEach(() => {
    TestSession.disposeAll()
    jest.restoreAllMocks()
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

  /**
   * Adds a mission file to the realm a member plays in.
   * @param member The member whose realm receives the file.
   * @param file The file to add.
   * @note The file goes into the realm's minted mission copy rather than
   * the session's mission template, because the download route resolves
   * files through the requester's subscribed realm.
   */
  function injectMissionFileIntoRealm(
    member: ServerSessionMember,
    file: TMissionFileJson,
  ): void {
    let mission = member.subscribedRealm.mission

    mission.files.push(ServerMissionFile.fromJson(file, mission))
  }

  /**
   * Lists the sessions visible to the given client.
   * @param client The authenticated client to list with.
   * @resolves With the listed session JSON.
   */
  async function listSessions(client: TestHttpClient): Promise<any[]> {
    let response = await client.get('/api/v1/sessions/')
    expect(response.status).toBe(200)
    return response.data
  }

  /**
   * Polls the session list until the given session no longer appears.
   * @param client The authenticated client to list with.
   * @param sessionId The ID of the session expected to leave the list.
   * @param timeoutMs How long to keep polling before failing.
   * @resolves Once the session is no longer listed.
   * @rejects If the session is still listed when the timeout elapses.
   */
  async function waitForSessionToLeaveList(
    client: TestHttpClient,
    sessionId: string,
    timeoutMs: number = 5000,
  ): Promise<void> {
    let deadline = Date.now() + timeoutMs

    while (Date.now() < deadline) {
      let sessions = await listSessions(client)
      if (!sessions.some((session) => session._id === sessionId)) return
      await new Promise((resolve) => setTimeout(resolve, 50))
    }

    throw new Error(`Session "${sessionId}" is still listed.`)
  }

  /**
   * Replaces the session's teardown with one that runs a single teardown
   * hook task whose script fails, so the session's real `teardownFailed`
   * check reads the failure the same way it would for a broken
   * environment.
   * @param session The live session whose teardown should fail.
   * @note The environment is built here and never registered, so no
   * installed target environment is involved.
   */
  function makeTeardownFail(session: SessionServer): void {
    let environment = new ServerTargetEnvironment(
      'test-env',
      'Test Env',
      'A self-contained environment whose teardown fails.',
      '1.0.0',
      [],
      [],
      'test-env-root',
    )

    jest.spyOn(session, 'tearDown').mockImplementation(async () => {
      let task = ServerEnvironmentTask.create(
        session,
        environment,
        session.realms[0]?.name ?? 'Test Realm',
        { kind: 'hook', method: 'environment-teardown' },
        async () => {
          throw new Error('Teardown failed on purpose.')
        },
      )
      task.announce()
      await task.run()
    })
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

  test('Launches a standalone session and reports its configured mode and force', async () => {
    // The mission is authored by an admin, because instructors lack the
    // 'missions_write' permission. Authoring it from a known payload is what
    // makes a valid standalone force ID available up front.
    let { client: adminClient } = await createTestContext()
    let adminUsername = `${suitePrefix}_standalone_admin_${generateRandomId()}`
    await createTestUser({
      username: adminUsername,
      password,
      accessId: 'admin',
    })
    await loginUser(adminClient, { username: adminUsername, password })

    let missionPayload = createMissionPayload(
      `${suitePrefix}_standalone_mission_${generateRandomId()}`,
    )
    let standaloneForceId = missionPayload.forces[0]._id
    let missionResponse = await adminClient.post(
      '/api/v1/missions/',
      missionPayload,
    )
    expect(missionResponse.status).toBe(200)
    let missionId = missionResponse.data._id
    expect(typeof missionId).toBe('string')

    // The instructor launches the standalone session from that mission.
    let { client } = await createTestContext()
    await createTestUser({ username, password })
    await loginUser(client, { username, password })

    let sessionName = `${suitePrefix}_standalone_${generateRandomId()}`
    let launchResponse = await client.post('/api/v1/sessions/launch/', {
      missionId,
      name: sessionName,
      mode: 'standalone',
      standaloneForceId,
    })
    expect(launchResponse.status).toBe(200)
    let sessionId = launchResponse.data.sessionId
    expect(typeof sessionId).toBe('string')
    sessionIdsToCleanup.push(sessionId)

    // The launched session reports the standalone mode and force it was
    // configured with.
    let listResponse = await client.get('/api/v1/sessions/')
    expect(listResponse.status).toBe(200)
    let found = listResponse.data.find(
      (session: any) => session._id === sessionId,
    )
    expect(found).toBeDefined()
    expect(found.config.mode).toBe('standalone')
    expect(found.config.standaloneForceId).toBe(standaloneForceId)
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
    // The session is started so that a realm is minted for the student.
    // Without one they fall back to the blank default realm, where every
    // file lookup misses and the 404 pre-empts the check under test.
    let context = await TestSession.launch({
      namePrefix: `${suitePrefix}_file_dl`,
      mission: { missionId: suiteMissionId },
      members: [{ force: 0 }],
      start: true,
    })
    let [student] = context.members

    // Inject a mission file no force has access to.
    let missionFileId = new Types.ObjectId().toHexString()
    let missionFileJson: TMissionFileJson = {
      _id: missionFileId,
      alias: `${suitePrefix}_file_${generateRandomId()}.txt`,
      lastKnownName: `${suitePrefix}_file_${generateRandomId()}.txt`,
      initialAccess: [],
      reference: new Types.ObjectId().toHexString(),
    }
    injectMissionFileIntoRealm(student.member, missionFileJson)

    // Attempt to download missing file.
    let missing = await student.client.get(
      `/api/v1/sessions/files/${new Types.ObjectId().toHexString()}/download`,
    )
    expect(missing.status).toBe(404)

    // Attempt to download existing file without access.
    let forbidden = await student.client.get(
      `/api/v1/sessions/files/${missionFileId}/download`,
    )
    expect(forbidden.status).toBe(403)
  })

  test('POST /api/v1/sessions/:_id/end/ requires auth to end a session', async () => {
    let { client } = await createTestContext()

    let response = await client.post(
      `/api/v1/sessions/${new Types.ObjectId().toHexString()}/end/`,
    )

    expect(response.status).toBe(401)
  })

  test('POST /api/v1/sessions/:_id/end/ returns 404 when ending a session that does not exist', async () => {
    let { client } = await createTestContext()
    await createTestUser({ username, password })
    await loginUser(client, { username, password })

    let response = await client.post(
      `/api/v1/sessions/${new Types.ObjectId().toHexString()}/end/`,
    )

    expect(response.status).toBe(404)
  })

  test('POST /api/v1/sessions/:_id/end/ rejects ending a session someone else owns without foreign session write', async () => {
    let { client: ownerClient } = await createTestContext()
    let { client: foreignClient } = await createTestContext()

    let ownerUser = `${suitePrefix}_end_owner_${generateRandomId()}`
    let foreignUser = `${suitePrefix}_end_foreign_${generateRandomId()}`
    await createTestUser({ username: ownerUser, password })
    await createTestUser({ username: foreignUser, password })
    await loginUser(ownerClient, { username: ownerUser, password })
    await loginUser(foreignClient, { username: foreignUser, password })

    let sessionId = await launchSession(
      ownerClient,
      suiteMissionId,
      `${suitePrefix}_end_owned_${generateRandomId()}`,
    )

    let response = await foreignClient.post(
      `/api/v1/sessions/${sessionId}/end/`,
    )

    expect(response.status).toBe(401)
    let sessions = await listSessions(ownerClient)
    expect(sessions.some((session) => session._id === sessionId)).toBe(true)
  })

  test('POST /api/v1/sessions/:_id/end/ allows ending a session someone else owns with foreign session write', async () => {
    let { client: ownerClient } = await createTestContext()
    let { client: adminClient } = await createTestContext()

    let ownerUser = `${suitePrefix}_end_owner_${generateRandomId()}`
    let adminUser = `${suitePrefix}_end_admin_${generateRandomId()}`
    await createTestUser({ username: ownerUser, password })
    await createTestUser({ username: adminUser, password, accessId: 'admin' })
    await loginUser(ownerClient, { username: ownerUser, password })
    await loginUser(adminClient, { username: adminUser, password })

    let sessionId = await launchSession(
      ownerClient,
      suiteMissionId,
      `${suitePrefix}_end_foreign_${generateRandomId()}`,
    )

    let response = await adminClient.post(`/api/v1/sessions/${sessionId}/end/`)

    expect(response.status).toBe(202)
  })

  test('POST /api/v1/sessions/:_id/end/ allows an owner to end their own unstarted session, which leaves the list', async () => {
    let { client } = await createTestContext()
    await createTestUser({ username, password })
    await loginUser(client, { username, password })

    let sessionId = await launchSession(
      client,
      suiteMissionId,
      `${suitePrefix}_end_native_${generateRandomId()}`,
    )

    let response = await client.post(`/api/v1/sessions/${sessionId}/end/`)

    expect(response.status).toBe(202)
    let sessions = await listSessions(client)
    expect(sessions.some((session) => session._id === sessionId)).toBe(false)
  })

  test('POST /api/v1/sessions/:_id/end/ ends a started session, removing its members without a request attached, and drops it once torn down', async () => {
    let { context } = await launchPlayableSession({
      namePrefix: `${suitePrefix}_end_started`,
      members: [{ force: 0 }],
    })
    let session = context.session
    let memberContexts = [context.owner, ...context.members]

    // Hold teardown open until the test releases it, so the members can
    // be checked while the session is still ending rather than after it
    // has been destroyed. The real teardown runs once released.
    let tearDown = session.tearDown.bind(session)
    let releaseTeardown: () => void = () => {}
    let teardownGate = new Promise<void>(
      (resolve) => (releaseTeardown = resolve),
    )
    jest.spyOn(session, 'tearDown').mockImplementation(async () => {
      await teardownGate
      await tearDown()
    })

    // Listen before ending so that no `session-ending` is missed.
    let endingEvents = memberContexts.map((memberContext) =>
      TestSession.waitFor(memberContext, 'session-ending'),
    )

    let response = await context.owner.client.post(
      `/api/v1/sessions/${context.id}/end/`,
    )

    expect(response.status).toBe(202)
    for (let event of await Promise.all(endingEvents)) {
      expect(event.request).toBeUndefined()
    }
    expect(session.joinedMembers.length).toBe(0)

    releaseTeardown()
    await waitForSessionToLeaveList(context.owner.client, context.id)
  })

  test('POST /api/v1/sessions/:_id/end/ leaves a session whose teardown fails ending, and rejects ending it again', async () => {
    let { context } = await launchPlayableSession({
      namePrefix: `${suitePrefix}_end_teardown_failed`,
      members: [{ force: 0 }],
    })
    makeTeardownFail(context.session)

    let endingEvent = TestSession.waitFor(context.owner, 'session-ending')
    let firstResponse = await context.owner.client.post(
      `/api/v1/sessions/${context.id}/end/`,
    )
    expect(firstResponse.status).toBe(202)
    await endingEvent

    // Wait for the failed teardown to settle.
    let session = context.session
    await new Promise<void>((resolve) => {
      let check = () => {
        if (session.teardownFailed) return resolve()
        setTimeout(check, 20)
      }
      check()
    })

    let sessions = await listSessions(context.owner.client)
    let listed = sessions.find((listed) => listed._id === context.id)
    expect(listed?.state).toBe('ending')
    expect(listed?.teardownFailed).toBe(true)

    let secondResponse = await context.owner.client.post(
      `/api/v1/sessions/${context.id}/end/`,
    )
    expect(secondResponse.status).toBe(409)
  })

  test('POST /api/v1/sessions/:_id/end/ rejects ending a session that is still starting, and lets it finish starting', async () => {
    let { context } = await launchPlayableSession({
      namePrefix: `${suitePrefix}_end_starting`,
      members: [{ force: 0 }],
      start: false,
    })
    let session = context.session

    // Hold setup open until the test releases it, so the session
    // stays in the `starting` state while the end is requested.
    let releaseSetup: () => void = () => {}
    let setupGate = new Promise<void>((resolve) => (releaseSetup = resolve))
    jest.spyOn(session, 'setUp').mockImplementation(() => setupGate)

    let startingEvent = TestSession.waitFor(context.owner, 'session-starting')
    TestSession.send(context.owner, {
      method: 'request-start-session',
      requestId: generateRandomId(),
      data: {},
    })
    await startingEvent

    let response = await context.owner.client.post(
      `/api/v1/sessions/${context.id}/end/`,
    )
    expect(response.status).toBe(409)

    let startedEvent = TestSession.waitFor(context.owner, 'session-started')
    releaseSetup()
    await startedEvent
    expect(session.state).toBe('started')
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
  })
})
