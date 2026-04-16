import { afterAll, beforeAll, describe, expect, test } from '@jest/globals'
import type { TMissionExistingJson } from '@shared/missions/Mission'
import type { TUserJson } from '@shared/users/User'
import { Types } from 'mongoose'
import { assertMissionMatchesExpectedData } from 'tests/helpers/projects/integration/rest-api/missions/assertions'
import {
  createMissionPayload,
  type TMissionCreatePayload,
} from 'tests/helpers/projects/integration/rest-api/missions/payload'
import {
  createMissionUpdatePayload,
  exportMissionArchive,
  fetchAllMissions,
  fetchMission,
  findImportedMission,
  importMissionArchive,
} from 'tests/helpers/projects/integration/rest-api/missions/requests'
import type { TestHttpClient } from 'tests/helpers/TestHttpClient'
import { TestSuiteSetup } from 'tests/helpers/TestSuiteSetup'
import { TestSuiteTeardown } from 'tests/helpers/TestSuiteTeardown'
import { TestToolbox } from 'tests/helpers/TestToolbox'

describe('/api/v1/missions', () => {
  const { generateRandomId, DEFAULT_PASSWORD: defaultPassword } = TestToolbox
  const { createTestContext, createTestUser } = TestSuiteSetup
  const { cleanupTestUsers, cleanupTestMissions } = TestSuiteTeardown

  const namePrefix = 'test_missions'
  let password: string = defaultPassword
  let defaultMissionId: string

  beforeAll(async () => {
    let { client } = await createTestContext()
    let response = await client.get('/api/v1/missions/')
    expect(response.status).toBe(401)

    let user = `${namePrefix}_bootstrap_${generateRandomId()}`
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

  async function createMission(
    client: TestHttpClient,
    payload: TMissionCreatePayload = createMissionPayload(),
  ): Promise<TMissionExistingJson> {
    let response = await client.post<TMissionExistingJson>(
      '/api/v1/missions/',
      payload,
    )
    let mission = response.data

    expect(response.status).toBe(200)
    expect(mission.name).toBe(payload.name)
    expect(mission._id).toBeDefined()

    if (!mission._id) {
      throw new Error('Mission ID is undefined')
    }

    return mission
  }

  test('GET /api/v1/missions/ requires auth and allows instructor access', async () => {
    let { client } = await createTestContext()

    let unauth = await client.get('/api/v1/missions/')
    expect(unauth.status).toBe(401)

    await loginWithAccess(client, 'student')
    let forbidden = await client.get('/api/v1/missions/')
    expect(forbidden.status).toBe(403)

    await logout(client)

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

    await logout(client)

    let username = `${namePrefix}_instructor_${generateRandomId()}`
    await loginWithAccess(client, 'instructor', username)
    let instructorForbidden = await client.post('/api/v1/missions/', {})
    expect(instructorForbidden.status).toBe(403)

    await logout(client)

    await loginWithAccess(client, 'admin')
    let invalidMission = await client.post('/api/v1/missions/', {})
    expect(invalidMission.status).toBe(400)
  })

  test('POST /api/v1/missions/ saves mission data correctly', async () => {
    let { client } = await createTestContext()
    await loginWithAccess(client, 'admin')

    let payload = createMissionPayload()
    let created = await createMission(client, payload)

    assertMissionMatchesExpectedData(created, payload)
  })

  test('GET /api/v1/missions/:_id/ returns saved mission data', async () => {
    let { client } = await createTestContext()
    await loginWithAccess(client, 'admin')

    let payload = createMissionPayload()
    let { _id: missionId } = await createMission(client, payload)
    let fetched = await fetchMission(client, missionId)

    assertMissionMatchesExpectedData(fetched, payload)
  })

  test('PUT /api/v1/missions/ saves changes to deeply nested mission data correctly', async () => {
    let { client } = await createTestContext()
    await loginWithAccess(client, 'admin')

    let created = await createMission(client)
    let updatePayload = createMissionUpdatePayload(created)
    let updatedName = `${created.name}_updated`

    updatePayload.name = updatedName
    updatePayload.resources[0].name = 'Supplies'
    updatePayload.forces[0].resourcePools[0].initialBalance = 245
    updatePayload.forces[0].nodes[1].description = 'Updated node description'
    updatePayload.forces[0].nodes[1].actions[0].resourceCosts[0].baseAmount = 22

    let updateResponse = await client.put<TMissionExistingJson>(
      '/api/v1/missions/',
      updatePayload,
    )

    expect(updateResponse.status).toBe(200)
    expect(updateResponse.data.name).toBe(updatedName)
    assertMissionMatchesExpectedData(updateResponse.data, updatePayload)

    let fetched = await fetchMission(client, created._id)
    assertMissionMatchesExpectedData(fetched, updatePayload)
  })

  test('POST /api/v1/missions/copy/ preserves mission data for copy-safe fields', async () => {
    let { client } = await createTestContext()
    await loginWithAccess(client, 'admin')

    let created = await createMission(client)
    let copyName = `${namePrefix}_copy_${generateRandomId()}`
    let copyResponse = await client.post<TMissionExistingJson>(
      '/api/v1/missions/copy/',
      {
        copyName,
        originalId: created._id,
      },
    )

    expect(copyResponse.status).toBe(200)
    expect(copyResponse.data._id).toBeDefined()
    expect(copyResponse.data._id).not.toBe(created._id)
    expect(copyResponse.data.name).toBe(copyName)

    let expectedCopy = structuredClone(created)
    expectedCopy.name = copyName
    assertMissionMatchesExpectedData(copyResponse.data, expectedCopy, {
      omitSeed: true,
    })
  })

  test('DELETE /api/v1/missions/:_id removes a created mission', async () => {
    let { client } = await createTestContext()
    await loginWithAccess(client, 'admin')

    let created = await createMission(client)
    let deleteResponse = await client.delete(`/api/v1/missions/${created._id}/`)

    expect(deleteResponse.status).toBe(200)

    let missing = await client.get(`/api/v1/missions/${created._id}/`)
    expect(missing.status).toBe(404)
  })

  test('POST /api/v1/missions/import/ requires missions write permission to access and returns 400 without files', async () => {
    let { client } = await createTestContext()

    let unauth = await client.post('/api/v1/missions/import/', {})
    expect(unauth.status).toBe(401)

    await loginWithAccess(client, 'instructor')
    let forbidden = await client.post('/api/v1/missions/import/', {})
    expect(forbidden.status).toBe(403)

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

    await logout(client)

    await loginWithAccess(client, 'instructor')
    let instructorForbidden = await client.get(
      `/api/v1/missions/${defaultMissionId}/export/file`,
    )
    expect(instructorForbidden.status).toBe(403)

    await logout(client)

    await loginWithAccess(client, 'admin')
    let mission = await createMission(client)

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

  test('Exporting and re-importing a mission keeps the saved data intact', async () => {
    let { client } = await createTestContext()
    await loginWithAccess(client, 'admin')

    let payload = createMissionPayload()
    let created = await createMission(client, payload)
    let existingMissionIds = new Set(
      (await fetchAllMissions(client)).map((mission) => mission._id),
    )

    let exportBuffer = await exportMissionArchive(client, created._id)
    let importResponse = await importMissionArchive(
      client,
      exportBuffer,
      `${namePrefix}_import_${generateRandomId()}.metis.zip`,
    )

    expect(importResponse.successfulImportCount).toBe(1)
    expect(importResponse.failedImportCount).toBe(0)

    let allMissions = await fetchAllMissions(client)
    let importedMissionData = findImportedMission(
      allMissions,
      created.name,
      existingMissionIds,
    )

    expect(importedMissionData).toBeDefined()
    if (!importedMissionData) {
      throw new Error('Expected imported mission data to exist.')
    }

    let importedMission = await fetchMission(client, importedMissionData._id)
    assertMissionMatchesExpectedData(importedMission, payload)
  })

  afterAll(async () => {
    await cleanupTestMissions(namePrefix)
    await cleanupTestUsers(namePrefix)
  })
})
