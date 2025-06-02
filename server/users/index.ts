import User, { TUserJson, TUserOptions } from 'metis/users'
import UserAccess, { TUserAccess } from 'metis/users/accesses'
import UserPermission, { TUserPermission } from 'metis/users/permissions'
import mongoose, {
  AnyObject,
  CallbackWithoutResultAndOptionalError,
} from 'mongoose'
import MetisDatabase from '../database'
import { TMetisServerComponents } from '../index'
import { TTargetEnvExposedUser } from '../target-environments/context'

/**
 * Class for managing users on the server.
 * @extends {User}
 */
export default class ServerUser extends User<TMetisServerComponents> {
  /**
   * Validates a hashed password.
   * @param password The password to validate.
   * @returns Whether the password is valid.
   */
  public static isValidHashedPassword = (
    password: NonNullable<TUserJson['password']>,
  ): boolean => {
    let passwordExpression: RegExp = /^\$2[ayb]\$.{56}$/
    let isValidPassword: boolean = passwordExpression.test(password)

    return isValidPassword
  }

  /**
   * Extracts the necessary properties from the user to be used as a reference
   * in a target environment.
   * @returns The user's necessary properties.
   */
  public toTargetEnvContext(): TTargetEnvExposedUser {
    return {
      _id: this._id,
      username: this.username,
    }
  }

  /**
   * Algorithm to check for duplicate _id's in the user.
   * @param cursor The current object to check.
   * @param existingIds The existing _id's that have been found.
   * @returns Any errors that are found.
   */
  private static idCheckerAlgorithm = (
    cursor: AnyObject | AnyObject[],
    existingIds: AnyObject = {},
  ): TUserValidationResults => {
    // If the cursor is an object, not an array, and not an ObjectId...
    if (
      cursor instanceof Object &&
      !Array.isArray(cursor) &&
      !mongoose.isObjectIdOrHexString(cursor)
    ) {
      // ...and it has an _id property and the _id already exists...
      if (cursor._id && cursor._id in existingIds) {
        // ...then set the error and return.
        let error = MetisDatabase.generateValidationError(
          `Error in user:\nDuplicate _id used (${cursor._id}).`,
        )
        return { error }
      }
      // Or, if the cursor is a User and the _id isn't a valid ObjectId...
      else if (
        cursor instanceof User &&
        !mongoose.isObjectIdOrHexString(cursor._id)
      ) {
        // ...then set the error and return.
        let error = MetisDatabase.generateValidationError(
          `Error in user:\nInvalid _id used (${cursor._id}).`,
        )
        return { error }
      }
      // Otherwise, add the _id to the existingIds object.
      else if (cursor._id) {
        existingIds[cursor._id] = true
      }

      // Check the object's values for duplicate _id's.
      for (let value of Object.values(cursor)) {
        let results = this.idCheckerAlgorithm(value, existingIds)
        if (results.error) return results
      }
    }
    // Otherwise, if the cursor is an array...
    else if (Array.isArray(cursor)) {
      // ...then check each value in the array for duplicate _id's.
      for (let value of cursor) {
        let results = this.idCheckerAlgorithm(value, existingIds)
        if (results.error) return results
      }
    }

    // Return an empty object.
    return {}
  }

  /**
   * Checks to see if a username already exists in the database.
   * @param userJson The user data to check.
   * @param isNew Determines if the user is new.
   * @returns The validation results.
   */
  private static duplicateUsernameChecker = async (
    userJson: TUserJson,
    isNew: boolean,
  ): Promise<TUserValidationResults> => {
    try {
      //       // Get the user from the database.
      //       let user = await UserModel.findById(userJson._id).exec()
      //
      //       // If the user is new and the username already exists,
      //       // throw an error.
      //       if (isNew && user?.username === userJson.username) {
      //         throw new StatusError(
      //           `Error in user:\nUsername "${userJson.username}" already exists.`,
      //           409,
      //         )
      //       }
      //
      //       // If the user isn't new and the username has changed,
      //       // check if the new username already exists.
      //       if (!isNew && user?.username !== userJson.username) {
      //         // Check if the new username already exists.
      //         let userWithSameUsername = await UserModel.findOne({
      //           username: userJson.username,
      //         }).exec()
      //
      //         // If the new username already exists, throw an error.
      //         if (userWithSameUsername) {
      //           throw new StatusError(
      //             `Error in user:\nUsername "${userJson.username}" already exists.`,
      //             409,
      //           )
      //         }
      //       }

      // If no errors were found, return an empty object.
      return {}
    } catch (error: any) {
      return { error }
    }
  }

  /**
   * Validates the user data.
   * @param userJson The user data to validate.
   * @param isNew Determines if the user is new.
   * @param next The next function to call.
   */
  public static validate = async (
    userJson: TUserJson,
    isNew: boolean,
    next: CallbackWithoutResultAndOptionalError,
  ): Promise<void> => {
    // Object to store results.
    let results: TUserValidationResults = {}

    // Check for duplicate _id's.
    results = this.idCheckerAlgorithm(userJson)
    // Check for error.
    if (results.error) return next(results.error)

    // Check for duplicate usernames.
    results = await this.duplicateUsernameChecker(userJson, isNew)
    // Check for error.
    if (results.error) return next(results.error)
  }

  /**
   * Validates the username of a user.
   * @param username The username to validate.
   */
  public static validateUsername(username: TUserJson['username']): void {
    if (!ServerUser.isValidUsername) {
      throw MetisDatabase.generateValidationError(
        `Error in user:\nUsername "${username}" is not valid.`,
      )
    }
  }

  /**
   * Validates the access ID of a user.
   * @param accessId The access ID to validate.
   */
  public static validateAccessId(accessId: TUserAccess['_id']): void {
    if (!UserAccess.isValidAccessId) {
      throw MetisDatabase.generateValidationError(
        `Error in user:\nAccess ID "${accessId}" is not valid.`,
      )
    }
  }

  /**
   * Validates the express permission ID of a user.
   * @param expressPermissionId The express permission ID to validate.
   */
  public static validateExpressPermissionId(
    expressPermissionId: TUserPermission['_id'],
  ): void {
    if (!UserPermission.isValidPermissionId) {
      throw MetisDatabase.generateValidationError(
        `Error in user:\nExpress permission ID "${expressPermissionId}" is not valid.`,
      )
    }
  }

  /**
   * Validates the name of a user.
   * @param name The name to validate.
   */
  public static validateName(
    name: TUserJson['firstName'] | TUserJson['lastName'],
  ): void {
    if (!ServerUser.isValidName) {
      throw MetisDatabase.generateValidationError(
        `Error in user:\nName "${name}" is not valid.`,
      )
    }
  }

  /**
   * Validates a hashed password.
   * @param password The password to validate.
   */
  public static validatePassword(
    password: NonNullable<TUserJson['password']>,
  ): void {
    if (!ServerUser.isValidHashedPassword) {
      throw MetisDatabase.generateValidationError(
        `Error in user:\nPassword "${password}" is not valid.`,
      )
    }
  }

  /**
   * Creates a new {@link ServerUser} instance used to represent
   * a previously-existing and now-deleted user.
   * @param knownData Optional partial data to initialize the user.
   * Only pass the properties known for the deleted user, if any.
   * @returns A new {@link ServerUser} instance.
   */
  public static createDeleted(knownData: Partial<TUserJson> = {}): ServerUser {
    return new ServerUser(knownData)
  }
}

/* ------------------------------ SERVER USER TYPES ------------------------------ */

/**
 * Options for creating a new Server User object.
 */
export type TServerUserOptions = TUserOptions & {}

/**
 * Possible user validation results.
 */
type TUserValidationResults = {
  /**
   * The error that was found during validation.
   */
  error?: Error
}
