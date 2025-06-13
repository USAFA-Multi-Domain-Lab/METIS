import { expect } from 'chai'
import { testLogger } from 'metis/server/logging'
import mongoose from 'mongoose'
import UserModel, { hashPassword } from '../../../database/models/users'
import ServerUser from '../../../users'
import { newCorrectUser } from '../../data'
import { agent } from '../../index.test'

/**
 * Tests the user schema validation functions that are used to validate data that is trying to be sent to
 * the database to be stored.
 */
export default function UserSchema(): Mocha.Suite {
  return describe('User Schema Validation', async function () {
    let response = await agent.get('/api/v1/logins/')
    let currentUser = ServerUser.fromExistingJson(response.body.user)

    it('Creating a user with all the correct properties should save the user to the database', async function () {
      try {
        // Hash the password.
        newCorrectUser.password = await hashPassword(newCorrectUser.password!)

        // Make sure the password was hashed.
        let isHashedPassword: boolean = ServerUser.isValidHashedPassword(
          newCorrectUser.password,
        )
        expect(isHashedPassword).to.equal(true)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }

      try {
        // Saves the user to the database
        let savedUser = await UserModel.create(newCorrectUser)
        // Make sure the database generated an ObjectId for the user.
        let hasObjectId: boolean =
          mongoose.isObjectIdOrHexString(savedUser._id) &&
          typeof savedUser._id === 'string'

        expect(hasObjectId).to.equal(true)
        expect(savedUser.username).to.equal(newCorrectUser.username)
        expect(savedUser.accessId).to.equal(newCorrectUser.accessId)
        expect(savedUser.firstName).to.equal(newCorrectUser.firstName)
        expect(savedUser.lastName).to.equal(newCorrectUser.lastName)

        // Save the user's ID for later use.
        newCorrectUser._id = savedUser._id
      } catch (error) {
        testLogger.error(error)
        throw error
      }
    })

    it('Querying for all users should return an array of users that includes the newly created user', async function () {
      try {
        let users = await UserModel.find()
          .setOptions({ currentUser, method: 'find' })
          .exec()
        // Find the newly created user in the array of users.
        let user = users.find(
          (user: any) => user.username === newCorrectUser.username,
        )
        // Make sure the database generated an ObjectId for the user.
        let hasObjectId: boolean =
          mongoose.isObjectIdOrHexString(user?._id) &&
          typeof user?._id === 'string'

        expect(users.length).to.be.greaterThan(0)
        expect(user).to.not.equal(undefined)
        expect(hasObjectId).to.equal(true)
        expect(user?._id).to.equal(newCorrectUser._id)
        expect(user?.username).to.equal(newCorrectUser.username)
        expect(user?.accessId).to.equal(newCorrectUser.accessId)
        expect(user?.firstName).to.equal(newCorrectUser.firstName)
        expect(user?.lastName).to.equal(newCorrectUser.lastName)
        expect(user?.password).to.equal(undefined)
      } catch (error) {
        testLogger.error(error)
        throw error
      }
    })

    it('Querying for the newly created user should return the correct user', async function () {
      try {
        // Query for the newly created user.
        let retrievedUser = await UserModel.findById(newCorrectUser._id)
          .setOptions({ currentUser, method: 'findOne' })
          .exec()

        // Make sure the database generated an ObjectId for the user.
        let hasObjectId: boolean =
          mongoose.isObjectIdOrHexString(retrievedUser?._id) &&
          typeof retrievedUser?._id === 'string'

        expect(hasObjectId).to.equal(true)
        expect(retrievedUser?._id).to.equal(newCorrectUser._id)
        expect(retrievedUser?.username).to.equal(newCorrectUser.username)
        expect(retrievedUser?.accessId).to.equal(newCorrectUser.accessId)
        expect(retrievedUser?.firstName).to.equal(newCorrectUser.firstName)
        expect(retrievedUser?.lastName).to.equal(newCorrectUser.lastName)
        expect(retrievedUser?.password).to.equal(undefined)
      } catch (error) {
        testLogger.error(error)
        throw error
      }
    })

    it('Updating a user should not hash the password again', async function () {
      try {
        let savedUser = await UserModel.findByIdAndUpdate(newCorrectUser._id, {
          firstName: 'updatedFirstName',
          lastName: 'updatedLastName',
        })
          .setOptions({ currentUser, method: 'findOneAndUpdate' })
          .exec()

        // Ensure the user was updated and the password was not hashed again.
        expect(savedUser).to.not.equal(null)
        expect(savedUser?._id).to.equal(newCorrectUser._id)
        expect(savedUser?.username).to.equal(newCorrectUser.username)
        expect(savedUser?.accessId).to.equal(newCorrectUser.accessId)
        expect(savedUser?.firstName).to.equal('updatedFirstName')
        expect(savedUser?.lastName).to.equal('updatedLastName')
        expect(savedUser?.password).to.equal(undefined)
      } catch (error) {
        testLogger.error(error)
        throw error
      }
    })

    it('Querying for the updated user should return the correct user', async function () {
      try {
        let retrievedUser = await UserModel.findById(newCorrectUser._id)
          .setOptions({ currentUser, method: 'findOne' })
          .exec()

        // Make sure the database generated an ObjectId for the user.
        let hasObjectId: boolean =
          mongoose.isObjectIdOrHexString(retrievedUser?._id) &&
          typeof retrievedUser?._id === 'string'

        expect(hasObjectId).to.equal(true)
        expect(retrievedUser?._id).to.equal(newCorrectUser._id)
        expect(retrievedUser?.username).to.equal(newCorrectUser.username)
        expect(retrievedUser?.accessId).to.equal(newCorrectUser.accessId)
        expect(retrievedUser?.firstName).to.equal('updatedFirstName')
        expect(retrievedUser?.lastName).to.equal('updatedLastName')
        expect(retrievedUser?.password).to.equal(undefined)
      } catch (error) {
        testLogger.error(error)
        throw error
      }
    })
  })
}
