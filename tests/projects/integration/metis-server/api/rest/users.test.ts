import { afterAll, beforeEach, describe, expect, test } from '@jest/globals'
import { Types } from 'mongoose'
import type { TestHttpClient } from 'tests/helpers/TestHttpClient'
import { TestToolbox } from 'tests/helpers/TestToolbox'
import { TestSuiteSetup } from 'tests/helpers/TestSuiteSetup'
import { TestSuiteTeardown } from 'tests/helpers/TestSuiteTeardown'

describe('/api/v1/users', () => {
  const { generateRandomId, DEFAULT_PASSWORD: defaultPassword } = TestToolbox
  const { createTestContext, createTestUser } = TestSuiteSetup
  const { cleanupTestUsers } = TestSuiteTeardown

  const usernamePrefix = 'test_users'
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

  test('Requires auth to list users', async () => {
    let { client } = await createTestContext()

    let response = await client.get('/api/v1/users/')

    expect(response.status).toBe(401)
  })

  test('Student cannot list users', async () => {
    let { client } = await createTestContext()
    await createTestUser({ username, password, accessId: 'student' })
    await loginUser(client, { username, password })

    let response = await client.get('/api/v1/users/')

    expect(response.status).toBe(403)
  })

  test('Instructor can list users', async () => {
    let { client } = await createTestContext()
    await createTestUser({ username, password, accessId: 'instructor' })
    await loginUser(client, { username, password })

    let response = await client.get('/api/v1/users/')

    expect(response.status).toBe(200)
    expect(Array.isArray(response.data)).toBe(true)
  })

  test('Instructor can create a student user', async () => {
    let { client } = await createTestContext()
    await createTestUser({ username, password, accessId: 'instructor' })
    await loginUser(client, { username, password })

    let studentUsername = `${usernamePrefix}_student_${generateRandomId()}`
    let response = await client.post('/api/v1/users/', {
      username: studentUsername,
      accessId: 'student',
      expressPermissionIds: [],
      firstName: 'Student',
      lastName: 'User',
      password,
      needsPasswordReset: false,
    })

    expect(response.status).toBe(200)
    expect(response.data.username).toBe(studentUsername)
    expect(response.data.accessId).toBe('student')
  })

  test('Instructor cannot create another instructor (requires admin)', async () => {
    let { client } = await createTestContext()
    await createTestUser({ username, password, accessId: 'instructor' })
    await loginUser(client, { username, password })

    let otherInstructor = `${usernamePrefix}_instructor_${generateRandomId()}`
    let response = await client.post('/api/v1/users/', {
      username: otherInstructor,
      accessId: 'instructor',
      expressPermissionIds: [],
      firstName: 'Instructor',
      lastName: 'User',
      password,
      needsPasswordReset: false,
    })

    expect(response.status).toBe(403)
  })

  test('Instructor can fetch, update, and delete a student user', async () => {
    let { client } = await createTestContext()
    await createTestUser({ username, password, accessId: 'instructor' })
    await loginUser(client, { username, password })

    let studentUsername = `${usernamePrefix}_student_${generateRandomId()}`
    let createResponse = await client.post('/api/v1/users/', {
      username: studentUsername,
      accessId: 'student',
      expressPermissionIds: [],
      firstName: 'Student',
      lastName: 'User',
      password,
      needsPasswordReset: false,
    })
    expect(createResponse.status).toBe(200)
    let studentId = createResponse.data._id

    let getResponse = await client.get(`/api/v1/users/${studentId}/`)
    expect(getResponse.status).toBe(200)
    expect(getResponse.data.username).toBe(studentUsername)

    let updatedLastName = 'Updated'
    let updateResponse = await client.put(`/api/v1/users/${studentId}/`, {
      username: studentUsername,
      accessId: 'student',
      expressPermissionIds: [],
      firstName: 'Student',
      lastName: updatedLastName,
      password,
      needsPasswordReset: true,
    })
    expect(updateResponse.status).toBe(200)
    expect(updateResponse.data.lastName).toBe(updatedLastName)

    let deleteResponse = await client.delete(`/api/v1/users/${studentId}/`)
    expect(deleteResponse.status).toBe(200)

    let missingResponse = await client.get(`/api/v1/users/${studentId}/`)
    expect(missingResponse.status).toBe(404)
  })

  test('User can reset own password and re-login', async () => {
    let { client } = await createTestContext()
    await createTestUser({ username, password, accessId: 'instructor' })
    await loginUser(client, { username, password })

    let newPassword = 'NewPassw0rd!'
    let resetResponse = await client.put('/api/v1/users/reset-password/', {
      password: newPassword,
    })

    expect(resetResponse.status).toBe(200)

    await client.delete('/api/v1/logins/')
    let relogin = await client.post('/api/v1/logins/', {
      username,
      password: newPassword,
    })

    expect(relogin.status).toBe(200)
  })

  test('User can update preferences', async () => {
    let { client } = await createTestContext()
    await createTestUser({ username, password, accessId: 'instructor' })
    await loginUser(client, { username, password })

    let loginStatus = await client.get('/api/v1/logins/')
    expect(loginStatus.status).toBe(200)
    let preferences = loginStatus.data?.user?.preferences
    let toggled = {
      ...preferences,
      missionMap: {
        ...preferences.missionMap,
        panOnIssueSelection: !preferences.missionMap.panOnIssueSelection,
      },
    }

    let response = await client.put('/api/v1/users/preferences/', {
      preferences: toggled,
    })

    expect(response.status).toBe(200)
    expect(response.data?.missionMap?.panOnIssueSelection).toBe(
      toggled.missionMap.panOnIssueSelection,
    )
  })

  test('Returns 404 when fetching unknown user by id', async () => {
    let { client } = await createTestContext()
    await createTestUser({ username, password, accessId: 'instructor' })
    await loginUser(client, { username, password })

    let response = await client.get(`/api/v1/users/${new Types.ObjectId()}/`)

    expect(response.status).toBe(404)
  })

  afterAll(async () => {
    await cleanupTestUsers(usernamePrefix)
  })
})
