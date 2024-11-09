import { expect } from 'chai'
import { testLogger } from 'metis/server/logging'
import mongoose from 'mongoose'
import UserModel, { hashPassword } from '../../../database/models/users'
import ServerUser from '../../../users'
import { newCorrectUser } from '../../data'

/**
 * Tests the user schema validation functions that are used to validate data that is trying to be sent to
 * the database to be stored.
 */
export default function UserSchema(): Mocha.Suite {
  return describe('User Schema Validation', function () {
    let hashedPassword: string = ''

    it('Creating a user with all the correct properties should save the user to the database', async function () {
      let user = new UserModel(newCorrectUser)

      try {
        // Hashes the password
        user.password = await hashPassword(user.password)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }

      try {
        // Saves the user to the database
        let savedUser = await user.save()
        // Make sure the database generated an ObjectId for the user.
        let hasObjectId: boolean = mongoose.isObjectIdOrHexString(savedUser._id)

        expect(hasObjectId).to.equal(true)
        expect(savedUser.username).to.equal(newCorrectUser.username)
        expect(savedUser.accessId).to.equal(newCorrectUser.accessId)
        expect(savedUser.firstName).to.equal(newCorrectUser.firstName)
        expect(savedUser.lastName).to.equal(newCorrectUser.lastName)
        hashedPassword = savedUser.password
        let isHashedPassword: boolean = ServerUser.isValidHashedPassword(
          savedUser.password,
        )
        expect(isHashedPassword).to.equal(true)
        expect(savedUser.password).to.equal(hashedPassword)
      } catch (error) {
        testLogger.error(error)
        throw error
      }
    })

    it('Querying for all users should return an array of users that includes the newly created user', async function () {
      try {
        let users = await UserModel.find().exec()
        // Find the newly created user in the array of users.
        let user = users.find(
          (user: any) => user.username === newCorrectUser.username,
        )
        // Make sure the database generated an ObjectId for the user.
        let hasObjectId: boolean = mongoose.isObjectIdOrHexString(user._id)

        expect(users.length).to.be.greaterThan(0)
        expect(user).to.not.equal(undefined)
        expect(hasObjectId).to.equal(true)
        expect(user.username).to.equal(newCorrectUser.username)
        expect(user.accessId).to.equal(newCorrectUser.accessId)
        expect(user.firstName).to.equal(newCorrectUser.firstName)
        expect(user.lastName).to.equal(newCorrectUser.lastName)
        let isHashedPassword: boolean = ServerUser.isValidHashedPassword(
          user.password,
        )
        expect(isHashedPassword).to.equal(true)
        expect(user.password).to.equal(hashedPassword)

        // Save the user's ID for later use.
        newCorrectUser._id = user._id.toString()
      } catch (error) {
        testLogger.error(error)
        throw error
      }
    })

    it('Querying for the newly created user should return the correct user', async function () {
      try {
        let retrievedUser = await UserModel.findOne({
          _id: newCorrectUser._id,
        }).exec()

        // Make sure the database generated an ObjectId for the user.
        let hasObjectId: boolean = mongoose.isObjectIdOrHexString(
          retrievedUser._id,
        )

        expect(hasObjectId).to.equal(true)
        expect(retrievedUser.username).to.equal(newCorrectUser.username)
        expect(retrievedUser.accessId).to.equal(newCorrectUser.accessId)
        expect(retrievedUser.firstName).to.equal(newCorrectUser.firstName)
        expect(retrievedUser.lastName).to.equal(newCorrectUser.lastName)
        let isHashedPassword: boolean = ServerUser.isValidHashedPassword(
          retrievedUser.password,
        )
        expect(isHashedPassword).to.equal(true)
        expect(retrievedUser.password).to.equal(hashedPassword)
      } catch (error) {
        testLogger.error(error)
        throw error
      }
    })

    it('Updating a user should not hash the password again', async function () {
      try {
        let savedUser = await UserModel.updateOne(
          {
            _id: newCorrectUser._id,
          },
          {
            firstName: 'updatedFirstName',
            lastName: 'updatedLastName',
          },
        ).exec()

        expect(savedUser.acknowledged).to.equal(true)
        expect(savedUser.matchedCount).to.equal(1)
        expect(savedUser.modifiedCount).to.equal(1)
      } catch (error) {
        testLogger.error(error)
        throw error
      }
    })

    it('Querying for the updated user should return the correct user', async function () {
      try {
        let retrievedUser = await UserModel.findOne({
          _id: newCorrectUser._id,
        }).exec()

        expect(retrievedUser._id.toString()).to.equal(newCorrectUser._id)
        expect(retrievedUser.username).to.equal(newCorrectUser.username)
        expect(retrievedUser.accessId).to.equal(newCorrectUser.accessId)
        expect(retrievedUser.firstName).to.equal('updatedFirstName')
        expect(retrievedUser.lastName).to.equal('updatedLastName')
        let isHashedPassword: boolean = ServerUser.isValidHashedPassword(
          retrievedUser.password,
        )
        expect(isHashedPassword).to.equal(true)
        expect(retrievedUser.password).to.equal(hashedPassword)
      } catch (error) {
        testLogger.error(error)
        throw error
      }
    })
  })
}
