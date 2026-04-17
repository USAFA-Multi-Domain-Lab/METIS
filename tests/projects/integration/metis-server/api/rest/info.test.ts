import { describe, expect, test } from '@jest/globals'
import { TestSuiteSetup } from 'tests/helpers/TestSuiteSetup'
import { TestToolbox } from 'tests/helpers/TestToolbox'
import packageJson from '../../../../../../package.json'

describe('/api/v1/info', () => {
  // Extract commonly used utilities.
  const { generateRandomId, DEFAULT_PASSWORD: defaultPassword } = TestToolbox
  const { createTestContext, createTestUser } = TestSuiteSetup

  // Per-test variables.
  const usernamePrefix = 'test_info'

  test('Returns basic service info', async () => {
    let { client } = await createTestContext()

    let response = await client.get('/api/v1/info/')

    expect(response.status).toBe(200)
    expect(response.data.version).toBe(packageJson.version)
    expect(response.data).toEqual(
      expect.objectContaining({
        name: expect.any(String),
        description: expect.any(String),
        version: expect.any(String),
      }),
    )
  })

  test('Returns credits markdown content', async () => {
    let { client } = await createTestContext()

    let response = await client.get('/api/v1/info/credits/')

    expect(response.status).toBe(200)
    expect(typeof response.data).toBe('string')
    expect(response.data.length).toBeGreaterThan(0)
    expect(response.data.toLowerCase()).toContain('metis')
  })

  test('Requires auth to read changelog', async () => {
    let { client } = await createTestContext()

    let response = await client.get('/api/v1/info/changelog/')

    expect(response.status).toBe(401)
  })

  test('Denies changelog to student role', async () => {
    let { client } = await createTestContext()
    let { username, password } = await createTestUser({
      username: `${usernamePrefix}_student_${generateRandomId()}`,
      password: defaultPassword,
      accessId: 'student',
    })

    await client.post('/api/v1/logins/', { username, password })

    let response = await client.get('/api/v1/info/changelog/')

    expect(response.status).toBe(403)
  })

  test('Allows changelog when user has "changelog_read" permission', async () => {
    let { client } = await createTestContext()
    let { username, password } = await createTestUser({
      username: `${usernamePrefix}_instructor_${generateRandomId()}`,
      password: defaultPassword,
      accessId: 'instructor',
    })

    await client.post('/api/v1/logins/', { username, password })

    let response = await client.get('/api/v1/info/changelog/')

    expect(response.status).toBe(200)
    expect(typeof response.data).toBe('string')
    expect(response.data.length).toBeGreaterThan(0)
  })
})
