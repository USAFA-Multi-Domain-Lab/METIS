import { afterAll, beforeAll, describe, expect, test } from '@jest/globals'
import type { TMissionJson } from '@shared/missions/Mission'
import type { TUserJson } from '@shared/users/User'
import { Types } from 'mongoose'
import type { TestHttpClient } from 'tests/middleware/TestHttpClient'
import { TestSuiteSetup } from 'tests/middleware/TestSuiteSetup'
import { TestSuiteTeardown } from 'tests/middleware/TestSuiteTeardown'
import { TestToolbox } from 'tests/toolbox/TestToolbox'

describe('/api/v1/missions', () => {
  // Extract commonly used utilities.
  const { generateRandomId, DEFAULT_PASSWORD: defaultPassword } = TestToolbox
  const { createTestContext, createTestUser } = TestSuiteSetup
  const { cleanupTestUsers, cleanupTestMissions } = TestSuiteTeardown

  // Per-test variables.
  const namePrefix = 'test_missions'
  let password: string = defaultPassword
  let missionIdsToCleanup: string[] = []
  let defaultMissionId: string

  beforeAll(async () => {
    let { client } = await createTestContext()
    let response = await client.get('/api/v1/missions/')
    expect(response.status).toBe(401)

    // Fetch default mission ID with auth.
    let user = `${namePrefix}_bootstrap_${generateRandomId()}`
    password = defaultPassword
    await createTestUser({
      username: user,
      password,
      accessId: 'instructor',
    })
    await client.post('/api/v1/logins/', { username: user, password })
    let authed = await client.get('/api/v1/missions/')
    expect(authed.status).toBe(200)
    expect(Array.isArray(authed.data)).toBe(true)
    expect(authed.data.length).toBeGreaterThan(0)
    defaultMissionId = authed.data[0]._id
  })

  async function loginWithAccess(
    client: TestHttpClient,
    accessId: TUserJson['accessId'] = 'instructor',
    username: TUserJson['username'] = `${namePrefix}_user_${generateRandomId()}`,
  ): Promise<string> {
    await createTestUser({
      username,
      password,
      accessId,
    })
    let response = await client.post('/api/v1/logins/', {
      username,
      password,
    })
    expect(response.status).toBe(200)
    return username
  }

  async function logout(client: TestHttpClient): Promise<void> {
    let response = await client.delete('/api/v1/logins/')
    expect(response.status).toBe(200)
  }

  async function fetchMissionDetail(client: TestHttpClient, missionId: string) {
    let response = await client.get(`/api/v1/missions/${missionId}/`)
    expect(response.status).toBe(200)
    return response.data
  }

  async function createMissionViaApi(
    client: TestHttpClient,
    baseMission: TMissionJson,
  ) {
    let payload: TMissionJson = {
      name: `${namePrefix}_created_${generateRandomId()}`,
      versionNumber: baseMission.versionNumber ?? 1,
      resourceLabel: baseMission.resourceLabel ?? 'resource',
      structure: baseMission.structure ?? {},
      forces: baseMission.forces ?? [],
      prototypes: baseMission.prototypes ?? [],
      files: baseMission.files ?? [],
      effects: baseMission.effects ?? [],
    }

    let response = await client.post<TMissionJson>('/api/v1/missions/', payload)
    expect(response.status).toBe(200)
    expect(response.data.name).toBe(payload.name)
    missionIdsToCleanup.push(response.data._id)
    return response.data
  }

  test('GET /api/v1/missions/ requires auth and allows instructor access', async () => {
    let { client } = await createTestContext()

    let unauth = await client.get('/api/v1/missions/')
    expect(unauth.status).toBe(401)

    await loginWithAccess(client, 'student')
    let forbidden = await client.get('/api/v1/missions/')
    expect(forbidden.status).toBe(403)

    // Log out the student before logging in as instructor.
    await logout(client)

    // Ensure instructor can read despite lacking write permissions.
    await loginWithAccess(client, 'instructor')
    let authed = await client.get('/api/v1/missions/')
    expect(authed.status).toBe(200)
    expect(Array.isArray(authed.data)).toBe(true)
    expect(authed.data.length).toBeGreaterThan(0)
  })

  test('GET /api/v1/missions/:_id/ returns mission and 404s on missing', async () => {
    let { client } = await createTestContext()
    await loginWithAccess(client)

    let found = await client.get(`/api/v1/missions/${defaultMissionId}/`)
    expect(found.status).toBe(200)
    expect(found.data._id).toBe(defaultMissionId)

    let missing = await client.get(
      `/api/v1/missions/${new Types.ObjectId().toHexString()}/`,
    )
    expect(missing.status).toBe(404)
  })

  test('POST /api/v1/missions/ requires admin access and enforces validation', async () => {
    let { client } = await createTestContext()

    let unauth = await client.post('/api/v1/missions/', {})
    expect(unauth.status).toBe(401)

    let studentUser = `${namePrefix}_student_${generateRandomId()}`
    await createTestUser({
      username: studentUser,
      password,
      accessId: 'student',
    })
    await client.post('/api/v1/logins/', { username: studentUser, password })
    let forbidden = await client.post('/api/v1/missions/', {})
    expect(forbidden.status).toBe(403)

    // Log out the student before logging in as instructor.
    await logout(client)

    let username = `${namePrefix}_instructor_${generateRandomId()}`
    await loginWithAccess(client, 'instructor', username)
    let instructorForbidden = await client.post('/api/v1/missions/', {})
    expect(instructorForbidden.status).toBe(403)
  })

  test('Creates mission, copies it, updates it, and deletes it', async () => {
    let { client } = await createTestContext()
    await loginWithAccess(client, 'admin')

    let baseMission = await fetchMissionDetail(client, defaultMissionId)
    let created = await createMissionViaApi(client, {
      ...baseMission,
      files: [],
    })

    let copyName = `${namePrefix}_copy_${generateRandomId()}`
    let copyResponse = await client.post('/api/v1/missions/copy/', {
      copyName,
      originalId: created._id,
    })
    expect(copyResponse.status).toBe(200)
    expect(copyResponse.data.name).toBe(copyName)
    missionIdsToCleanup.push(copyResponse.data._id)

    let updatedName = `${created.name}_updated`
    let updateResponse = await client.put('/api/v1/missions/', {
      _id: created._id,
      name: updatedName,
    })
    expect(updateResponse.status).toBe(200)
    expect(updateResponse.data.name).toBe(updatedName)

    let deleteResponse = await client.delete(`/api/v1/missions/${created._id}/`)
    expect(deleteResponse.status).toBe(200)
    missionIdsToCleanup = missionIdsToCleanup.filter((id) => id !== created._id)
  })

  test('POST /api/v1/missions/import/ requires missions write permission to access and returns 400 without files', async () => {
    let { client } = await createTestContext()

    let unauth = await client.post('/api/v1/missions/import/', {})
    expect(unauth.status).toBe(401)

    await loginWithAccess(client, 'instructor')
    let forbidden = await client.post('/api/v1/missions/import/', {})
    expect(forbidden.status).toBe(403)

    // Log out the instructor before logging in as admin.
    await logout(client)

    await loginWithAccess(client, 'admin')
    let noFiles = await client.post('/api/v1/missions/import/', {})
    expect(noFiles.status).toBe(400)
  })

  test('GET /api/v1/missions/:_id/export/* requires missions read/write permission to download', async () => {
    let { client } = await createTestContext()

    let unauth = await client.get(
      `/api/v1/missions/${defaultMissionId}/export/file`,
    )
    expect(unauth.status).toBe(401)

    await loginWithAccess(client, 'student')
    let forbidden = await client.get(
      `/api/v1/missions/${defaultMissionId}/export/file`,
    )
    expect(forbidden.status).toBe(403)

    // Log out the student before logging in as instructor.
    await logout(client)

    await loginWithAccess(client, 'instructor')
    let instructorForbidden = await client.get(
      `/api/v1/missions/${defaultMissionId}/export/file`,
    )
    expect(instructorForbidden.status).toBe(403)

    // Log out the instructor before logging in as admin.
    await logout(client)

    await loginWithAccess(client, 'admin')

    // Create a valid mission based on the seeded mission, but remove files so
    // export does not depend on file-store state.
    let baseMission = await fetchMissionDetail(client, defaultMissionId)
    let mission = await createMissionViaApi(client, {
      ...baseMission,
      files: [],
    })

    let exportResp = await client.get(
      `/api/v1/missions/${mission._id}/export/file`,
    )
    expect(exportResp.status).toBe(200)
  })

  test('GET /api/v1/missions/:_id/export/* 400s on invalid id and 404s on missing mission', async () => {
    let { client } = await createTestContext()
    await loginWithAccess(client, 'admin')

    let invalidId = await client.get('/api/v1/missions/not-an-id/export/file')
    expect(invalidId.status).toBe(400)

    let missingId = new Types.ObjectId().toHexString()
    let missing = await client.get(`/api/v1/missions/${missingId}/export/file`)
    expect(missing.status).toBe(404)
  })

  afterAll(async () => {
    await cleanupTestMissions(namePrefix)
    await cleanupTestUsers(namePrefix)
  })
})
