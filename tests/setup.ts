import { useMetisServer } from './middleware'

/**
 * Global setup for API integration tests
 * Starts the server once before any tests run
 */
export default async function globalSetup() {
  process.env.METIS_ENV_TYPE = 'test'
  // Map available middleware to global scope for
  // use in tests.
  globalThis.useMetisServer = useMetisServer
}
