import { expect } from 'chai'
import { testLogger } from 'metis/server/logging'
import ServerUser from 'metis/server/users'
import { agent } from '../../index.test'

/**
 * Tests each of the API route endpoints that are used to access the target environment data on the server.
 */
export default function TargetEnvApiRoute(): Mocha.Suite {
  return describe('Target Environment API Route', function () {
    it('The user should have the correct permission(s) to use the API route for missions', async function () {
      try {
        let response = await agent.get('/api/v1/logins/')
        let user = new ServerUser(response.body.user)
        let hasCorrectPermissions: boolean = user.isAuthorized([
          'environments_read',
        ])

        expect(hasCorrectPermissions).to.equal(true)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Sending a request to the target environment API route should return a successful (200) response', async function () {
      try {
        let response = await agent.get('/api/v1/target-environments')
        expect(response).to.have.status(200)
        expect(response.body).to.have.length.greaterThan(0)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })
  })
}
