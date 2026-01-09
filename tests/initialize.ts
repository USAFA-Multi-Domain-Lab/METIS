import { afterAll, beforeAll, expect } from '@jest/globals'
import fs from 'fs'
import path from 'path'
import { TestMetisServer } from './middleware/TestMetisServer'

// Set test environment variable.
const envType = 'test'
process.env.METIS_ENV_TYPE = envType

// Expose for tests that call the helper directly while preserving class context.
const useMetisServer = () => TestMetisServer.use()
globalThis.useMetisServer = useMetisServer

let serverStarted = false
let serverPromise:
  | Promise<Awaited<ReturnType<typeof useMetisServer>>>
  | undefined

beforeAll(async () => {
  expect(process.env.METIS_ENV_TYPE).toBe(envType)

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
  let expectedMongoDbValues = ['metis-test']
  let envMongoDb = process.env.MONGO_DB
  if (envMongoDb) {
    expectedMongoDbValues.push(envMongoDb)
  }
  expect(expectedMongoDbValues).toContain(server.mongoDB)
})

afterAll(async () => {
  if (serverStarted) {
    await TestMetisServer.stop()
    serverStarted = false
    serverPromise = undefined

    expect(TestMetisServer.isRunning()).toBe(false)
  }
})
