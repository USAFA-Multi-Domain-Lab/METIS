import { beforeAll, describe, expect, test } from '@jest/globals'
import type { TMissionExistingJson } from '@shared/missions/Mission'
import type { TAnyObject } from '@shared/toolbox/objects/ObjectToolbox'
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
import { TestToolbox } from 'tests/helpers/TestToolbox'

describe('/api/v1/missions', () => {
  const { generateRandomId, DEFAULT_PASSWORD: defaultPassword } = TestToolbox
  const { createTestContext, createTestUser } = TestSuiteSetup

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

  test('PUT /api/v1/missions/ rejects an unknown field on one of two actions and keeps both actions', async () => {
    let { client } = await createTestContext()
    await loginWithAccess(client, 'admin')

    // Give the objective node a second action so one can carry the bad
    // field while the other stays valid.
    let payload = createMissionPayload()
    let objectiveActions = payload.forces[0].nodes[1].actions
    let secondAction = structuredClone(objectiveActions[0])
    secondAction._id = generateRandomId()
    secondAction.name = 'Action 2'
    secondAction.localKey = '2'
    for (let cost of secondAction.resourceCosts) cost._id = generateRandomId()
    for (let effect of secondAction.effects) {
      effect._id = generateRandomId()
      for (let argument of effect.arguments) argument._id = generateRandomId()
    }
    objectiveActions.push(secondAction)

    let created = await createMission(client, payload)
    let requestBody: TAnyObject = createMissionUpdatePayload(created)
    requestBody.forces[0].nodes[1].actions[0].color = 'red'

    let updateResponse = await client.put('/api/v1/missions/', requestBody)
    expect(updateResponse.status).toBe(400)

    let fetched = await fetchMission(client, created._id)
    expect(fetched.forces[0].nodes[1].actions).toHaveLength(2)
    assertMissionMatchesExpectedData(fetched, created)
  })

  test('PUT /api/v1/missions/ rejects an unknown top-level field', async () => {
    let { client } = await createTestContext()
    await loginWithAccess(client, 'admin')

    let created = await createMission(client)
    let requestBody: TAnyObject = createMissionUpdatePayload(created)
    requestBody.color = 'red'

    let updateResponse = await client.put('/api/v1/missions/', requestBody)
    expect(updateResponse.status).toBe(400)

    let fetched = await fetchMission(client, created._id)
    assertMissionMatchesExpectedData(fetched, created)
  })

  test('PUT /api/v1/missions/ rejects a null action', async () => {
    let { client } = await createTestContext()
    await loginWithAccess(client, 'admin')

    let created = await createMission(client)
    let requestBody: TAnyObject = createMissionUpdatePayload(created)
    requestBody.forces[0].nodes[1].actions[0] = null

    let updateResponse = await client.put('/api/v1/missions/', requestBody)
    expect(updateResponse.status).toBe(400)

    let fetched = await fetchMission(client, created._id)
    assertMissionMatchesExpectedData(fetched, created)
  })

  test('PUT /api/v1/missions/ rejects a null force', async () => {
    let { client } = await createTestContext()
    await loginWithAccess(client, 'admin')

    let created = await createMission(client)
    let requestBody: TAnyObject = createMissionUpdatePayload(created)
    requestBody.forces[0] = null

    let updateResponse = await client.put('/api/v1/missions/', requestBody)
    expect(updateResponse.status).toBe(400)

    let fetched = await fetchMission(client, created._id)
    assertMissionMatchesExpectedData(fetched, created)
  })

  test('PUT /api/v1/missions/ rejects two nodes sharing an _id', async () => {
    let { client } = await createTestContext()
    await loginWithAccess(client, 'admin')

    let created = await createMission(client)
    let requestBody: TAnyObject = createMissionUpdatePayload(created)
    let nodes = requestBody.forces[0].nodes
    nodes[1]._id = nodes[0]._id

    let updateResponse = await client.put('/api/v1/missions/', requestBody)
    expect(updateResponse.status).toBe(400)

    let fetched = await fetchMission(client, created._id)
    assertMissionMatchesExpectedData(fetched, created)
  })

  test('POST /api/v1/missions/ rejects an unknown field on an action and creates nothing', async () => {
    let { client } = await createTestContext()
    await loginWithAccess(client, 'admin')

    let requestBody: TAnyObject = createMissionPayload()
    requestBody.forces[0].nodes[1].actions[0].color = 'red'

    let createResponse = await client.post('/api/v1/missions/', requestBody)
    expect(createResponse.status).toBe(400)

    let missions = await fetchAllMissions(client)
    expect(missions.map(({ name }) => name)).not.toContain(requestBody.name)
  })

  test('POST /api/v1/missions/ rejects a null prototype and creates nothing', async () => {
    let { client } = await createTestContext()
    await loginWithAccess(client, 'admin')

    let requestBody: TAnyObject = createMissionPayload()
    requestBody.prototypes.push(null)

    let createResponse = await client.post('/api/v1/missions/', requestBody)
    expect(createResponse.status).toBe(400)

    let missions = await fetchAllMissions(client)
    expect(missions.map(({ name }) => name)).not.toContain(requestBody.name)
  })

  test('POST /api/v1/missions/ rejects a null resource and creates nothing', async () => {
    let { client } = await createTestContext()
    await loginWithAccess(client, 'admin')

    let requestBody: TAnyObject = createMissionPayload()
    requestBody.resources.push(null)

    let createResponse = await client.post('/api/v1/missions/', requestBody)
    expect(createResponse.status).toBe(400)

    let missions = await fetchAllMissions(client)
    expect(missions.map(({ name }) => name)).not.toContain(requestBody.name)
  })

  test('POST /api/v1/missions/ sanitizes large-string effect arguments and leaves other argument types alone', async () => {
    let { client } = await createTestContext()
    await loginWithAccess(client, 'admin')

    let payload = createMissionPayload()
    let effect = payload.effects[0]
    let numberArgument = effect.arguments[0]
    let messageArgumentId = generateRandomId()

    effect.arguments.push({
      _id: messageArgumentId,
      parameterId: 'message',
      type: 'large-string',
      value:
        '<p>Reactor offline</p><img src="x" onerror="alert(1)"><svg onload="alert(2)"></svg>',
    })

    let { _id: missionId } = await createMission(client, payload)
    let fetched = await fetchMission(client, missionId)
    let savedArguments = fetched.effects?.[0].arguments ?? []
    let savedMessage = savedArguments.find(
      (argument) => argument._id === messageArgumentId,
    )

    // The formatting an author wrote is kept. The parts that would run in
    // a member's browser are not.
    expect(savedMessage?.value).toBe('<p>Reactor offline</p>')
    expect(savedMessage?.value).not.toContain('onerror')
    expect(savedMessage?.value).not.toContain('onload')

    // An argument holding something other than HTML is stored as it was.
    let savedNumber = savedArguments.find(
      (argument) => argument._id === numberArgument._id,
    )
    expect(savedNumber?.value).toBe(numberArgument.value)
  })

  test('POST /api/v1/missions/ sanitizes an untyped argument holding HTML and leaves untyped plain text alone', async () => {
    let { client } = await createTestContext()
    await loginWithAccess(client, 'admin')

    let payload = createMissionPayload()
    let effect = payload.effects[0]
    let htmlArgumentId = generateRandomId()
    let plainTextArgumentId = generateRandomId()

    // A mission saved before the typed-argument format arrived records its
    // arguments as "unknown", which is how an imported file can present one.
    effect.arguments.push({
      _id: htmlArgumentId,
      parameterId: 'message',
      type: 'unknown',
      value: '<p>Reactor offline</p><img src="x" onerror="alert(1)">',
    } as unknown as (typeof effect.arguments)[number])

    // Plain writing that happens to carry angle brackets must survive intact.
    effect.arguments.push({
      _id: plainTextArgumentId,
      parameterId: 'callSign',
      type: 'unknown',
      value: 'Report to <commander> at <time> when a < b',
    } as unknown as (typeof effect.arguments)[number])

    let { _id: missionId } = await createMission(client, payload)
    let fetched = await fetchMission(client, missionId)
    let savedArguments = fetched.effects?.[0].arguments ?? []

    let savedHtml = savedArguments.find(
      (argument) => argument._id === htmlArgumentId,
    )
    expect(savedHtml?.value).toBe('<p>Reactor offline</p>')

    let savedPlainText = savedArguments.find(
      (argument) => argument._id === plainTextArgumentId,
    )
    expect(savedPlainText?.value).toBe(
      'Report to <commander> at <time> when a < b',
    )
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
    assertMissionMatchesExpectedData(copyResponse.data, expectedCopy)
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
})
