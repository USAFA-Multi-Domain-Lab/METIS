import { afterAll, beforeEach, describe, expect, test } from '@jest/globals'
import type { TestHttpClient } from 'tests/helpers/TestHttpClient'
import { TestToolbox } from 'tests/helpers/TestToolbox'
import { TestSuiteSetup } from 'tests/helpers/TestSuiteSetup'
import { TestSuiteTeardown } from 'tests/helpers/TestSuiteTeardown'

describe('/api/v1/target-environments', () => {
  const { generateRandomId, DEFAULT_PASSWORD: defaultPassword } = TestToolbox
  const { createTestContext, createTestUser } = TestSuiteSetup
  const { cleanupTestUsers } = TestSuiteTeardown

  const usernamePrefix = 'test_target_envs'
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

    let migrateResponse = await client.post(
      '/api/v1/target-environments/migrate/effect-args',
      {
        targetId: 'delay',
        environmentId: 'metis',
        effectEnvVersion: '0.2.1',
        effectArgs: {
          delayTimeHours: 0,
          delayTimeMinutes: 0,
          delayTimeSeconds: 0,
        },
      },
    )

    expect(migrateResponse.status).toBe(200)
    expect(migrateResponse.data.resultingVersion).toBe('0.2.1')
    expect(migrateResponse.data.resultingArgs).toMatchObject({
      delayTimeHours: 0,
      delayTimeMinutes: 0,
      delayTimeSeconds: 0,
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

    let invalid = await client.post(
      '/api/v1/target-environments/migrate/effect-args',
      {
        targetId: 'delay',
        environmentId: 'metis',
        effectEnvVersion: 'not-a-version',
        effectArgs: {},
      },
    )
    expect(invalid.status).toBe(400)

    let missingTarget = await client.post(
      '/api/v1/target-environments/migrate/effect-args',
      {
        targetId: 'missing-target',
        environmentId: 'metis',
        effectEnvVersion: '0.2.1',
        effectArgs: {},
      },
    )
    expect(missingTarget.status).toBe(404)

    let missingEnvironment = await client.post(
      '/api/v1/target-environments/migrate/effect-args',
      {
        targetId: 'delay',
        environmentId: 'missing-environment',
        effectEnvVersion: '0.2.1',
        effectArgs: {},
      },
    )
    expect(missingEnvironment.status).toBe(404)
  })

  afterAll(async () => {
    await cleanupTestUsers(usernamePrefix)
  })
})
