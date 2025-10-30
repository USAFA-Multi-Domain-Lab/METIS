import { stopMetisServer } from './middleware'

/**
 * Global teardown for API integration tests.
 * Stops the server once after all tests have run.
 */
export default async function globalTeardown() {
  await stopMetisServer()
}
