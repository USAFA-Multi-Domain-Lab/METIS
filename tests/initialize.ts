import { afterAll, beforeAll, expect } from '@jest/globals'
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
