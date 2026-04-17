import { afterAll, beforeAll, expect } from '@jest/globals'
import { InfoModel } from '@server/database/models/info'
import { MetisServer } from '@server/MetisServer'
import fs from 'fs'
import path from 'path'
import { TestMetisServer } from './helpers/TestMetisServer'

// Set test environment variable.
process.env.METIS_ENV_TYPE = TestMetisServer.METIS_ENV_TYPE

// Expose for tests that call the helper directly while preserving class context.
const useMetisServer = () => TestMetisServer.use()
globalThis.useMetisServer = useMetisServer

let serverStarted = false
let serverPromise:
  | Promise<Awaited<ReturnType<typeof useMetisServer>>>
  | undefined

beforeAll(async () => {
  expect(process.env.METIS_ENV_TYPE).toBe(TestMetisServer.METIS_ENV_TYPE)

  // Ensure the test file store starts clean for each Jest run.
  if (!process.env.FILE_STORE_DIR) {
    process.env.FILE_STORE_DIR = './server/files/store-test'
  }
  let storeDir = path.resolve(process.cwd(), process.env.FILE_STORE_DIR)
  try {
    fs.rmSync(storeDir, { recursive: true, force: true })
    fs.mkdirSync(storeDir, { recursive: true })
  } catch (error) {
    console.warn('Failed to reset test file store directory.')
    console.warn(error)
  }

  if (!serverPromise) {
    serverPromise = globalThis.useMetisServer()
  }
  let server = await serverPromise
  serverStarted = true

  expect(TestMetisServer.isRunning()).toBe(true)

  // Verify server is using test database.
  expect(process.env.MONGO_DB).toBe(server.mongoDB)

  let info = await InfoModel.findOne().lean().exec()
  expect(info?.schemaBuildNumber).toBe(MetisServer.SCHEMA_BUILD_NUMBER)
})

afterAll(async () => {
  if (serverStarted) {
    await TestMetisServer.stop()
    serverStarted = false
    serverPromise = undefined

    expect(TestMetisServer.isRunning()).toBe(false)
  }
})
