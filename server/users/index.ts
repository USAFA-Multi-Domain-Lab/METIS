import User, {
  TCreatedByJson,
  TUserExistingJson,
  TUserJson,
  TUserOptions,
} from 'metis/users'
import UserAccess, { TUserAccess, TUserAccessId } from 'metis/users/accesses'
import UserPermission, { TUserPermission } from 'metis/users/permissions'
import mongoose, {
  AnyObject,
  CallbackWithoutResultAndOptionalError,
} from 'mongoose'
import MetisDatabase from '../database'
import { TUserModel } from '../database/models/types'
import { StatusError } from '../http'
import { TMetisServerComponents } from '../index'
import { TTargetEnvExposedUser } from '../target-environments/context'

/**
 * Class for managing users on the server.
 * @extends {User}
 */
export default class ServerUser extends User<TMetisServerComponents> {
  protected constructor(
    ...args: ConstructorParameters<typeof User<TMetisServerComponents>>
  ) {
    super(...args)
  }

  /**
   * Validates a hashed password.
   * @param password The password to validate.
   * @returns Whether the password is valid.
   */
  public static isValidHashedPassword = (
    password: NonNullable<TUserJson['password']>,
  ): boolean => {
    let passwordExpression: RegExp = /^$|^\$2[ayb]\$.{56}$/
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
  private static validateAllIds = (
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
        let results = this.validateAllIds(value, existingIds)
        if (results.error) return results
      }
    }
    // Otherwise, if the cursor is an array...
    else if (Array.isArray(cursor)) {
      // ...then check each value in the array for duplicate _id's.
      for (let value of cursor) {
        let results = this.validateAllIds(value, existingIds)
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
  private static validateUniqueUsername = async (
    model: TUserModel,
    userJson: TUserJson,
    isNew: boolean,
  ): Promise<TUserValidationResults> => {
    try {
      // Get the user from the database.
      let user = await model.findById(userJson._id).exec()

      // If the user is new and the username already exists,
      // throw an error.
      if (isNew && user?.username === userJson.username) {
        throw new StatusError(
          `Error in user:\nUsername "${userJson.username}" already exists.`,
          409,
        )
      }

      // If the user isn't new and the username has changed,
      // check if the new username already exists.
      if (!isNew && user?.username !== userJson.username) {
        // Check if the new username already exists.
        let userWithSameUsername = await model
          .findOne({
            username: userJson.username,
          })
          .exec()

        // If the new username already exists, throw an error.
        if (userWithSameUsername) {
          throw new StatusError(
            `Error in user:\nUsername "${userJson.username}" already exists.`,
            409,
          )
        }
      }

      // If no errors were found, return an empty object.
      return {}
    } catch (error: any) {
      return { error }
    }
  }

  /**
   * Ensures that non-system users have passwords and
   * system users do not.
   * @param userJson The user data to validate.
   * @param isNew Whether the user is new or existing.
   */
  public static validatePasswordRequirement = (
    userJson: TUserJson,
    isNew: boolean,
  ): TUserValidationResults => {
    // If the user is a system user, ensure that
    //  the password is not set.
    if (userJson.accessId === 'system' && userJson.password) {
      return {
        error: MetisDatabase.generateValidationError(
          `Error in user:\nSystem users cannot have passwords.`,
        ),
      }
    }
    // If the user is not a system user, ensure
    // that the password is set, if the user is new.
    else if (userJson.accessId !== 'system' && !userJson.password && isNew) {
      return {
        error: MetisDatabase.generateValidationError(
          `Error in user:\nNon-system users must have passwords.`,
        ),
      }
    } else {
      return {}
    }
  }

  /**
   * Validates the user data.
   * @param userJson The user data to validate.
   * @param isNew Determines if the user is new.
   * @param next The next function to call.
   */
  public static validate = async (
    model: TUserModel,
    userJson: TUserJson,
    isNew: boolean,
    next: CallbackWithoutResultAndOptionalError,
  ): Promise<void> => {
    // Object to store results.
    let results: TUserValidationResults = {}

    // Performs the given validation as long as no
    // previous validation failed.
    const validateIfNoError = async (
      validator: () => Promise<TUserValidationResults>,
    ) => {
      // If there is no error, call the callback.
      if (!results.error) {
        results = await validator()
        // If the callback returned an error, call
        // the next function with the error.
        if (results.error) return next(results.error)
      }
    }

    // Run validations until error is found,
    // or if no error, the data is valid.
    await validateIfNoError(async () => this.validateAllIds(userJson))
    await validateIfNoError(async () =>
      this.validateUniqueUsername(model, userJson, isNew),
    )
    await validateIfNoError(async () =>
      this.validatePasswordRequirement(userJson, isNew),
    )
  }

  /**
   * Validates the username of a user.
   * @param username The username to validate.
   */
  public static validateUsername(username: TUserJson['username']): void {
    if (!ServerUser.isValidUsername(username)) {
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
    if (!UserAccess.isValidAccessId(accessId)) {
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
    if (!UserPermission.isValidPermissionId(expressPermissionId)) {
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
    if (!ServerUser.isValidName(name)) {
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
    if (!ServerUser.isValidHashedPassword(password)) {
      throw MetisDatabase.generateValidationError(
        `Error in user:\nPassword "${password}" is not valid.`,
      )
    }
  }

  /**
   * @param _id The ID of the user.
   * @param username The username of the user.
   * @returns a new user that is not populated with
   * any data, just the ID and username.
   */
  public static createUnpopulated(_id: string, username: string): ServerUser {
    // Gather details.
    const {
      accessId,
      firstName,
      lastName,
      needsPasswordReset,
      expressPermissionIds,
      preferences,
      createdAt,
      updatedAt,
      createdBy,
      createdByUsername,
    } = User.DEFAULT_PROPERTIES
    const access = UserAccess.get(accessId)
    const expressPermissions = UserPermission.get(expressPermissionIds)

    // Return and create a new ServerUser instance.
    return new ServerUser(
      _id,
      username,
      access,
      firstName,
      lastName,
      needsPasswordReset,
      expressPermissions,
      preferences,
      createdAt,
      updatedAt,
      createdBy,
      createdByUsername,
    )
  }

  /**
   * @param json The JSON data of an existing user in the
   * database.
   * @returns a new {@link ServerUser} instance.
   */
  public static fromExistingJson(json: TUserExistingJson): ServerUser {
    let createdBy: ServerUser

    // Determine the value of createdBy.
    if (typeof json.createdBy === 'object') {
      createdBy = ServerUser.fromCreatedByJson(json.createdBy)
    } else if (typeof json.createdBy === 'string') {
      createdBy = ServerUser.createUnpopulated(
        json.createdBy,
        json.createdByUsername,
      )
    } else {
      throw new Error('Invalid createdBy field in user JSON.')
    }

    // Create a new user.
    return new ServerUser(
      json._id,
      json.username,
      UserAccess.get(json.accessId),
      json.firstName,
      json.lastName,
      json.needsPasswordReset,
      UserPermission.get(json.expressPermissionIds),
      json.preferences,
      new Date(json.createdAt),
      new Date(json.updatedAt),
      createdBy,
      json.createdByUsername,
    )
  }

  /**
   * Creates a new {@link ServerUser} instance used from the
   * JSON data of a `createdBy` field of a document.
   * @note createdBy will be unpopulated to prevent infinite
   * population loops.
   * @note Express permissions and preferences will be excluded
   * to maintain security and privacy.
   */
  public static fromCreatedByJson(json: TCreatedByJson): ServerUser {
    // Create a new user.
    return new ServerUser(
      json._id,
      json.username,
      UserAccess.get(json.accessId),
      json.firstName,
      json.lastName,
      json.needsPasswordReset,
      UserPermission.get(User.DEFAULT_PROPERTIES.expressPermissionIds),
      User.DEFAULT_PROPERTIES.preferences,
      new Date(json.createdAt),
      new Date(json.updatedAt),
      ServerUser.createUnpopulated(json.createdBy, json.createdByUsername),
      json.createdByUsername,
    )
  }

  /**
   * Determines what types of users can be accessed by the current user.
   * @param currentUser The user that is currently logged in and has an active session.
   * @return An array of user access IDs that the current user can access.
   */
  public static canAccess(
    currentUser: ServerUser,
    operation?: 'read' | 'write',
  ): TUserAccessId[] {
    const { isAuthorized } = currentUser
    const adminAccess: TUserAccessId[] = [
      'default',
      'student',
      'instructor',
      'admin',
      'revokedAccess',
    ]
    const studentAccess: TUserAccessId[] = ['student']

    switch (operation) {
      case 'read':
        if (isAuthorized(['users_read'])) return adminAccess
        if (isAuthorized(['users_read_students'])) return studentAccess
        return []
      case 'write':
        if (isAuthorized(['users_write'])) return adminAccess
        if (isAuthorized(['users_write_students'])) return studentAccess
        return []
      default:
        return []
    }
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
