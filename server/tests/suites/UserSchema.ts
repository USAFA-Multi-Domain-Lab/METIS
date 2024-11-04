import { expect } from 'chai'
import UserModel, { hashPassword } from '../../database/models/users'
import { testLogger } from '../../logging'
import ServerUser from '../../users'
import { newCorrectUser } from '../data'

/**
 * Tests the user schema validation functions that are used to validate data that is trying to be sent to
 * the database to be stored.
 */
export default function UserSchema(): Mocha.Suite {
  return describe('User Schema Validation', function () {
    let hashedPassword: string = ''

    it('Creating a user with all the correct properties should save the user to the database', async function () {
      let user = new UserModel(newCorrectUser.user)

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

        expect(savedUser._id.toString()).to.equal(newCorrectUser.user._id)
        expect(savedUser.username).to.equal(newCorrectUser.user.username)
        expect(savedUser.accessId).to.equal(newCorrectUser.user.accessId)
        expect(savedUser.firstName).to.equal(newCorrectUser.user.firstName)
        expect(savedUser.lastName).to.equal(newCorrectUser.user.lastName)
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

    it('Querying for the newly created user should return the correct user', async function () {
      try {
        let retrievedUser = await UserModel.findOne({
          _id: newCorrectUser.user._id,
        }).exec()

        expect(retrievedUser._id.toString()).to.equal(newCorrectUser.user._id)
        expect(retrievedUser.username).to.equal(newCorrectUser.user.username)
        expect(retrievedUser.accessId).to.equal(newCorrectUser.user.accessId)
        expect(retrievedUser.firstName).to.equal(newCorrectUser.user.firstName)
        expect(retrievedUser.lastName).to.equal(newCorrectUser.user.lastName)
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
            _id: newCorrectUser.user._id,
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
          _id: newCorrectUser.user._id,
        }).exec()

        expect(retrievedUser._id.toString()).to.equal(newCorrectUser.user._id)
        expect(retrievedUser.username).to.equal(newCorrectUser.user.username)
        expect(retrievedUser.accessId).to.equal(newCorrectUser.user.accessId)
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
