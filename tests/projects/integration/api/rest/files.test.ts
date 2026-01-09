import { afterAll, describe, expect, test } from '@jest/globals'
import FormData from 'form-data'
import fs from 'fs'
import { Types } from 'mongoose'
import path from 'path'
import type { TestHttpClient } from 'tests/middleware/TestHttpClient'
import { TestSuiteSetup } from 'tests/middleware/TestSuiteSetup'
import { TestSuiteTeardown } from 'tests/middleware/TestSuiteTeardown'
import { TestToolbox } from 'tests/toolbox/TestToolbox'

describe('/api/v1/files', () => {
  // Extract commonly used utilities.
  const { generateRandomId, DEFAULT_PASSWORD: defaultPassword } = TestToolbox
  const { createTestContext, createTestUser } = TestSuiteSetup
  const { cleanupTestUsers, cleanupTestFiles } = TestSuiteTeardown

  // Per-test variables.
  const namePrefix = 'test_files'
  let password: string = defaultPassword

  async function loginWithAccess(
    client: TestHttpClient,
    accessId: 'student' | 'instructor' | 'admin',
  ): Promise<{ username: string; password: string }> {
    let username = `${namePrefix}_${accessId}_${generateRandomId()}`
    await createTestUser({ username, password, accessId })
    let response = await client.post('/api/v1/logins/', { username, password })
    expect(response.status).toBe(200)
    return { username, password }
  }

  async function uploadTestFile(
    client: TestHttpClient,
    uploaderAccess: 'admin',
  ): Promise<any> {
    await loginWithAccess(client, uploaderAccess)
    let form = new FormData()
    let filename = `${namePrefix}_${generateRandomId()}.txt`
    let buffer = Buffer.from('hello world')
    form.append('files', buffer, { filename, contentType: 'text/plain' })

    let response = await client.post('/api/v1/files/', form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    })
    expect(response.status).toBe(200)
    expect(Array.isArray(response.data)).toBe(true)
    expect(response.data[0].name).toBe(filename)
    return response.data[0]
  }

  test('GET /api/v1/files/ requires auth and lists for instructors', async () => {
    let { client } = await createTestContext()

    let unauth = await client.get('/api/v1/files/')
    expect(unauth.status).toBe(401)

    await loginWithAccess(client, 'instructor')
    let authed = await client.get('/api/v1/files/')
    expect(authed.status).toBe(200)
    expect(Array.isArray(authed.data)).toBe(true)
  })

  test('GET /api/v1/files/:_id returns file reference and 404s when missing', async () => {
    let { client } = await createTestContext()
    let fileRef = await uploadTestFile(client, 'admin')

    let found = await client.get(`/api/v1/files/${fileRef._id}`)
    expect(found.status).toBe(200)
    expect(found.data._id).toBe(fileRef._id)

    let missing = await client.get(
      `/api/v1/files/${new Types.ObjectId().toHexString()}`,
    )
    expect(missing.status).toBe(404)
  })

  test('GET /api/v1/files/:_id/download enforces auth and allows readers', async () => {
    let { client } = await createTestContext()
    let fileRef = await uploadTestFile(client, 'admin')

    // Reset client to unauthenticated state.
    client.resetCookies()

    let unauth = await client.get(`/api/v1/files/${fileRef._id}/download`)
    expect(unauth.status).toBe(401)

    let { client: readerClient } = await createTestContext()
    await loginWithAccess(readerClient, 'instructor')
    let download = await readerClient.get(
      `/api/v1/files/${fileRef._id}/download`,
      {
        responseType: 'arraybuffer',
      },
    )
    expect(download.status).toBe(200)
    expect(download.headers['content-type']).toContain('text/plain')

    let invalid = await readerClient.get('/api/v1/files/not-an-id/download')
    expect(invalid.status).toBe(400)
  })

  test('POST /api/v1/files/ requires write permission and validates files', async () => {
    let { client } = await createTestContext()

    let unauth = await client.post('/api/v1/files/', {})
    expect(unauth.status).toBe(401)

    await loginWithAccess(client, 'student')
    let forbidden = await client.post('/api/v1/files/', {})
    expect(forbidden.status).toBe(403)

    await loginWithAccess(client, 'admin')
    let noFiles = await client.post('/api/v1/files/', {})
    expect(noFiles.status).toBe(400)

    let fileRef = await uploadTestFile(client, 'admin')
    expect(fileRef).toHaveProperty('_id')
  })

  test('DELETE /api/v1/files/:_id enforces permissions and 404s when missing', async () => {
    let { client } = await createTestContext()
    let fileRef = await uploadTestFile(client, 'admin')

    // Reset client to unauthenticated state.
    client.resetCookies()

    let unauth = await client.delete(`/api/v1/files/${fileRef._id}`)
    expect(unauth.status).toBe(401)

    let { client: instructorClient } = await createTestContext()
    await loginWithAccess(instructorClient, 'instructor')
    let forbidden = await instructorClient.delete(
      `/api/v1/files/${fileRef._id}`,
    )
    expect(forbidden.status).toBe(403)

    let { client: adminClient } = await createTestContext()
    await loginWithAccess(adminClient, 'admin')
    let missing = await adminClient.delete(
      `/api/v1/files/${new Types.ObjectId().toHexString()}`,
    )
    expect(missing.status).toBe(404)

    let deleted = await adminClient.delete(`/api/v1/files/${fileRef._id}`)
    expect(deleted.status).toBe(200)
  })

  afterAll(async () => {
    await cleanupTestFiles(namePrefix)
    await cleanupTestUsers(namePrefix)

    // Remove any lingering uploaded files.
    let storeDir = path.join('server', 'files', 'store')
    if (fs.existsSync(storeDir)) {
      for (let file of fs.readdirSync(storeDir)) {
        if (file.startsWith(namePrefix)) {
          fs.unlinkSync(path.join(storeDir, file))
        }
      }
    }
  })
})
