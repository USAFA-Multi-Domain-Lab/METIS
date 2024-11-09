import { expect } from 'chai'
import { before } from 'mocha'
import { testLogger } from '../logging/index'
import { userCredentials } from './data'
import { agent } from './index.test'
import { testServer } from './server'

/**
 * Sets up the test environment by starting the test server and creating a session with a user.
 */
export default function Setup(): void {
  return before(async function () {
    try {
      // Starts the test server
      await testServer.serve()

      // Checks to make sure the correct database is being used
      if (testServer.mongoDB === 'metis-test') {
        // Creates a session with a user because
        // certain API routes require authentication
        // for access
        let response = await agent.post('/api/v1/logins/').send(userCredentials)
        expect(response).to.have.status(200)
      } else {
        throw new Error(
          'Database is not using "metis-test." Please make sure the test database is running.',
        )
      }
    } catch (error: any) {
      if (
        error.message ===
        'Database is not using "metis-test." Please make sure the test database is running.'
      ) {
        testLogger.error(error)
        process.exit(1)
      } else {
        testLogger.error(error)
        throw error
      }
    }
  })
}
