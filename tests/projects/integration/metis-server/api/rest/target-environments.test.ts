import { beforeEach, describe, expect, test } from '@jest/globals'
import type { TMissionExistingJson } from '@shared/missions/Mission'
import { Types } from 'mongoose'
import { createMissionPayload } from 'tests/helpers/projects/integration/rest-api/missions/payload'
import type { TestHttpClient } from 'tests/helpers/TestHttpClient'
import { TestSuiteSetup } from 'tests/helpers/TestSuiteSetup'
import { TestToolbox } from 'tests/helpers/TestToolbox'

describe('/api/v1/target-environments', () => {
  const { generateRandomId, DEFAULT_PASSWORD: defaultPassword } = TestToolbox
  const { createTestContext, createTestUser } = TestSuiteSetup

  const usernamePrefix = 'test_target_envs'
  const missionNamePrefix = 'test_target_envs_mission'
  let username: string
  let password: string = defaultPassword

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

  async function createMission(
    client: TestHttpClient,
  ): Promise<TMissionExistingJson> {
    let payload = createMissionPayload(
      `${missionNamePrefix}_${generateRandomId()}`,
    )
    let response = await client.post<TMissionExistingJson>(
      '/api/v1/missions/',
      payload,
    )

    expect(response.status).toBe(200)

    return response.data
  }

  test('Requires auth to list target environments', async () => {
    let { client } = await createTestContext()

    let response = await client.get('/api/v1/target-environments/')

    expect(response.status).toBe(401)
  })

  test('Student can list target environments', async () => {
    let { client } = await createTestContext()
    await createTestUser({ username, password, accessId: 'student' })
    await loginUser(client, { username, password })

    let response = await client.get('/api/v1/target-environments/')

    expect(response.status).toBe(200)
    expect(Array.isArray(response.data)).toBe(true)
  })

  test('Admin can list target environments', async () => {
    let { client } = await createTestContext()
    await createTestUser({ username, password, accessId: 'admin' })
    await loginUser(client, { username, password })

    let response = await client.get('/api/v1/target-environments/')

    expect(response.status).toBe(200)
    expect(Array.isArray(response.data)).toBe(true)
    expect(response.data.length).toBeGreaterThan(0)
  })

  test('Admin can migrate effect args', async () => {
    let { client } = await createTestContext()
    await createTestUser({ username, password, accessId: 'admin' })
    await loginUser(client, { username, password })
    let mission = await createMission(client)
    let effect = mission.effects[0]

    let migrateResponse = await client.post(
      '/api/v1/target-environments/migrate/effect-args',
      {
        effectId: effect._id,
        missionId: mission._id,
      },
    )

    expect(migrateResponse.status).toBe(200)
    expect(migrateResponse.data.result.version).toBe(
      effect.targetEnvironmentVersion,
    )
    expect(migrateResponse.data.result.data).toMatchObject({
      delayTimeHours: 0,
      delayTimeMinutes: 0,
      delayTimeSeconds: 1,
    })
  })

  test('Migrate effect args requires auth and validates payload', async () => {
    let { client } = await createTestContext()

    let unauth = await client.post(
      '/api/v1/target-environments/migrate/effect-args',
      {},
    )
    expect(unauth.status).toBe(401)

    await createTestUser({ username, password, accessId: 'admin' })
    await loginUser(client, { username, password })
    let mission = await createMission(client)

    let invalid = await client.post(
      '/api/v1/target-environments/migrate/effect-args',
      {
        effectId: 123,
        missionId: mission._id,
      },
    )
    expect(invalid.status).toBe(400)

    let missingTarget = await client.post(
      '/api/v1/target-environments/migrate/effect-args',
      {
        effectId: mission.effects[0]._id,
        missionId: new Types.ObjectId().toHexString(),
      },
    )
    expect(missingTarget.status).toBe(404)

    let missingEnvironment = await client.post(
      '/api/v1/target-environments/migrate/effect-args',
      {
        effectId: 'missing-effect',
        missionId: mission._id,
      },
    )
    expect(missingEnvironment.status).toBe(404)
  })
})
