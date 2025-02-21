import { expect } from 'chai'
import { testLogger } from 'metis/server/logging'
import ServerUser from 'metis/server/users'
import { correctUser, userCredentials, userWithNoPassword } from '../../data'
import { agent } from '../../index.test'

/**
 * Tests each of the API route endpoints that are used to access the user data on the server.
 */
export default function UserApiRoute(): Mocha.Suite {
  return describe('User API Route', function () {
    const newPassword: string = 'updatedPassword'

    it('The user should have the correct permission(s) to use the API route for users', async function () {
      try {
        let login = await agent.get('/api/v1/logins/')
        let { user: userJson } = login.body
        let user = new ServerUser(userJson)
        let hasCorrectPermissions: boolean = user.isAuthorized([
          'users_read_students',
          'users_write_students',
        ])

        expect(hasCorrectPermissions).to.equal(true)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Getting all users should return a successful (200) response', async function () {
      try {
        let response = await agent.get('/api/v1/users/')

        expect(response).to.have.status(200)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Creating a user with (a) missing property/properties in the body of the request should return a bad request (400) response', async function () {
      try {
        let response = await agent
          .post('/api/v1/users/')
          .send(userWithNoPassword)

        expect(response).to.have.status(400)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Creating a user with all the correct properties in the body of the request should return a successful (200) response', async function () {
      try {
        let response = await agent.post('/api/v1/users/').send(correctUser)
        // Check if the response is successful.
        expect(response).to.have.status(200)
        // Save the user's ID for later use.
        correctUser._id = response.body._id
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Getting a user with all the correct properties in the params of the request should return a successful (200) response', async function () {
      try {
        let response = await agent.get(`/api/v1/users/${correctUser._id}`)
        expect(response).to.have.status(200)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Getting a user with an incorrect "_id" in the params of the request should return a bad request (400) response', async function () {
      try {
        let response = await agent.get(`/api/v1/users/${2}`)
        expect(response).to.have.status(400)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it(`Updating a user's first and last name should return a successful (200) response`, async function () {
      // Update the user's first and last name.
      correctUser.firstName = 'updatedFirstName'
      correctUser.lastName = 'updatedLastName'

      try {
        let response = await agent.put('/api/v1/users/').send(correctUser)
        // Check if the response is successful.
        expect(response).to.have.status(200)
        // Check if the user's first and last name have been updated.
        let { firstName, lastName } = response.body
        expect(firstName).to.equal('updatedFirstName')
        expect(lastName).to.equal('updatedLastName')
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it(`Updating a user's password with a missing property ("password") in the body of the request should return a bad request (400) response`, async function () {
      try {
        let login = await agent.get('/api/v1/logins/')
        let { user: currentUser } = login.body

        let response = await agent.put('/api/v1/users/reset-password').send({
          _id: currentUser._id,
          needsPasswordReset: false,
        })

        // Check if the response is successful.
        expect(response).to.have.status(400)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it(`Updating another user's password should return a forbidden (403) response`, async function () {
      try {
        let response = await agent.put('/api/v1/users/reset-password').send({
          _id: correctUser._id,
          password: 'updatedPassword',
          needsPasswordReset: false,
        })

        // Check if the response is successful.
        expect(response).to.have.status(403)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it(`Updating a user's password should return a successful (200) response`, async function () {
      try {
        let login = await agent.get('/api/v1/logins/')
        let { user: currentUser } = login.body

        let response = await agent.put('/api/v1/users/reset-password').send({
          _id: currentUser._id,
          password: newPassword,
          needsPasswordReset: false,
        })

        // Check if the response is successful.
        expect(response).to.have.status(200)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it(`Updating a user's password to a number should return a bad request (400) response`, async function () {
      try {
        let login = await agent.get('/api/v1/logins/')
        let { user: currentUser } = login.body

        let response = await agent.put('/api/v1/users/reset-password').send({
          _id: currentUser._id,
          password: 123456,
          needsPasswordReset: false,
        })

        expect(response).to.have.status(400)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it("Updating a user with all the correct properties in the body of the request should return a user with the same '_id' as the one in the body of the request", async function () {
      correctUser.firstName = 'UpdatedUserWithSameId'

      try {
        let response = await agent.put('/api/v1/users/').send(correctUser)
        expect(response.body._id).to.equal(correctUser._id)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it(`Logging out the user should return a successful (200) response`, async function () {
      try {
        let response = await agent.delete('/api/v1/logins/')
        expect(response).to.have.status(200)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it(`Logging in with the updated password should return a successful (200) response`, async function () {
      try {
        let response = await agent.post('/api/v1/logins/').send({
          username: userCredentials.username,
          password: newPassword,
        })
        expect(response).to.have.status(200)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Deleting a user with all the correct properties in the params of the request should return a successful (200) response', async function () {
      try {
        let response = await agent.delete(`/api/v1/users/${correctUser._id}`)
        expect(response).to.have.status(200)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })
  })
}
