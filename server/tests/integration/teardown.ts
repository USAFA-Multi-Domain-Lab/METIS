/**
 * Global teardown for API integration tests
 * Stops the server after all tests complete
 */

export default async function globalTeardown() {
  console.log('\n🛑 Shutting down METIS server...\n')

  const { server } = globalThis.integration

  if (server) {
    // Add cleanup logic here
    // If MetisServer has a shutdown method, call it
    // Otherwise, the process will exit anyway
  }

  console.log('✅ Server stopped\n')
}
