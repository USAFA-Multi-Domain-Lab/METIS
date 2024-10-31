import { expect } from 'chai'
import { testLogger } from '../../logging'
import { correctUser, userWithNoPassword } from '../data'
import { agent, permittedUserAccess } from '../index.test'

/**
 * Tests each of the API routes that are used to access the user data in the database.
 */
export default function UserApiRoutes(): Mocha.Suite {
  return describe('User API Routes', function () {
    it('User should be logged in as an admin to be able to create users via the API', async function () {
      try {
        let response = await agent.get('/api/v1/logins/')

        expect(response.body.user.accessId).to.equal(permittedUserAccess)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Creating a user with (a) missing property/properties in the body of the request should return a bad request (400) response', async function () {
      try {
        let response = await agent
          .post('/api/v1/users/')
          .set('Content-Type', 'application/json')
          .send(userWithNoPassword)

        expect(response).to.have.status(400)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Creating a user with all the correct properties in the body of the request should return a successful (200) response', async function () {
      try {
        let response = await agent
          .post('/api/v1/users/')
          .set('Content-Type', 'application/json')
          .send(correctUser)

        expect(response).to.have.status(200)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it(`Updating a user's first and last name should return a successful (200) response`, async function () {
      correctUser.user.firstName = 'updatedFirstName'
      correctUser.user.lastName = 'updatedLastName'

      try {
        let response = await agent
          .put('/api/v1/users/')
          .set('Content-Type', 'application/json')
          .send(correctUser)

        let user: any = response.body.user
        expect(user.firstName).to.equal('updatedFirstName')
        expect(user.lastName).to.equal('updatedLastName')
        expect(response).to.have.status(200)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Deleting a mission with all the correct properties in the query of the request should return a successful (200) response', async function () {
      try {
        let response = await agent.delete(
          `/api/v1/users/${correctUser.user._id}`,
        )

        expect(response).to.have.status(200)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })
  })
}
