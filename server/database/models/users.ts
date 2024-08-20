import bcryptjs from 'bcryptjs'
import { Request } from 'express'
import ServerUser from 'metis/server/users'
import { AnyObject } from 'metis/toolbox/objects'
import User, { TCommonUserJson } from 'metis/users'
import UserAccess, { TUserAccess } from 'metis/users/accesses'
import UserPermission, { TUserPermission } from 'metis/users/permissions'
import mongoose, { Schema } from 'mongoose'
import MetisDatabase from '..'
import { StatusError } from '../../http'
import { databaseLogger } from '../../logging'
import Access from '../schema-types/user-access'
import Permission from '../schema-types/user-permission'

let ObjectId = mongoose.Types.ObjectId

/* -- SCHEMA VALIDATORS -- */

/**
 * Validates the user data.
 * @param user The user data to validate.
 * @param next The next function to call.
 */
const validate_users = (user: any, next: any): void => {
  // Object to store results.
  let results: { error?: Error } = {}
  // Object to store existing _id's.
  let existingIds: AnyObject = {}

  // Algorithm to check for duplicate _id's.
  const _idCheckerAlgorithm = (cursor = user) => {
    // If the cursor has a _doc property and its an object...
    if (cursor._doc !== undefined && cursor._doc instanceof Object) {
      // ...then set the cursor to the _doc property.
      cursor = cursor._doc
    }
    // If the cursor is an object, but not an ObjectId...
    if (cursor instanceof Object && !(cursor instanceof ObjectId)) {
      // ...and it has an _id property and the _id already exists...
      if (cursor._id && cursor._id in existingIds) {
        // ...then set the error and return.
        results.error = new Error(
          `Error in user:\nDuplicate _id used (${cursor._id}).`,
        )
        results.error.name = MetisDatabase.ERROR_BAD_DATA
        return
      }
      // Or, if the cursor is a User and the _id isn't a valid ObjectId...
      else if (
        cursor instanceof User &&
        !mongoose.isValidObjectId(cursor._id)
      ) {
        // ...then set the error and return.
        results.error = new Error(
          `Error in user:\nInvalid _id used (${cursor._id}).`,
        )
        results.error.name = MetisDatabase.ERROR_BAD_DATA
        return
      }
      // Otherwise, add the _id to the existingIds object.
      else {
        existingIds[cursor._id] = true
      }
      // Check the object's values for duplicate _id's.
      for (let value of Object.values(cursor)) {
        _idCheckerAlgorithm(value)
      }
    }
    // Otherwise, if the cursor is an array...
    else if (cursor instanceof Array) {
      // ...then check each value in the array for duplicate _id's.
      for (let value of cursor) {
        _idCheckerAlgorithm(value)
      }
    }
  }

  // Check for duplicate _id's.
  _idCheckerAlgorithm()

  // Check for error.
  if (results.error) {
    return next(results.error)
  }

  return next()
}

/**
 * Validates the username of a user.
 * @param username The username to validate.
 */
const validate_users_username = (
  username: TCommonUserJson['username'],
): boolean => {
  return User.isValidUsername(username)
}

/**
 * Validates the access ID of a user.
 * @param accessId The access ID to validate.
 */
const validate_users_accessId = (accessId: TUserAccess['_id']): boolean => {
  return UserAccess.isValidAccessId(accessId)
}

/**
 * Validates the express permission IDs of a user.
 * @param expressPermissionIds The express permission IDs to validate.
 */
const validate_users_expressPermissionIds = (
  expressPermissionIds: TUserPermission['_id'][],
): boolean => {
  // Contains whether each permission is valid.
  let validExpressPermissionIds: TUserPermission['_id'][] = []

  // Loops through each permission and checks if it is valid.
  expressPermissionIds.forEach((permissionId: TUserPermission['_id']) => {
    // If it is valid, it is added to the array.
    if (UserPermission.isValidPermissionId(permissionId)) {
      validExpressPermissionIds.push(permissionId)
    }
  })

  // If the valid express permissions array matches the
  // express permissions array that was passed, then all
  // permissions are valid.
  return validExpressPermissionIds.length === expressPermissionIds.length
}

/**
 * Validates the name of a user.
 * @param name The name to validate.
 */
const validate_users_name = (
  name: TCommonUserJson['firstName'] | TCommonUserJson['lastName'],
): boolean => {
  return User.isValidName(name)
}

/**
 * Validates a hashed password.
 * @param password The password to validate.
 */
const validator_users_password = (
  password: NonNullable<TCommonUserJson['password']>,
): boolean => {
  return ServerUser.isValidHashedPassword(password)
}

/* -- SCHEMA -- */

const UserSchema = new Schema(
  {
    username: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      validate: validate_users_username,
    },
    accessId: {
      type: Access,
      required: true,
      validate: validate_users_accessId,
    },
    expressPermissionIds: {
      type: [Permission],
      required: true,
      validate: validate_users_expressPermissionIds,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
      validate: validate_users_name,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      validate: validate_users_name,
    },
    needsPasswordReset: { type: Boolean, required: true },
    password: {
      type: String,
      required: true,
      validate: validator_users_password,
    },
    deleted: { type: Boolean, required: true, default: false },
  },
  {
    strict: 'throw',
    minimize: false,
  },
)

/* -- SCHEMA METHODS -- */

/**
 * Hashes a password for storage in the database.
 * @param password The password to hash.
 * @returns A promise that resolves to the hashed password.
 */
export const hashPassword = async (password: string): Promise<string> => {
  return new Promise<string>(async (resolve, reject): Promise<void> => {
    try {
      let hashedPassword: string = await bcryptjs.hash(password, 10)
      resolve(hashedPassword)
    } catch (error) {
      databaseLogger.error('Failed to hash password:')
      databaseLogger.error(error)
      reject(error)
    }
  })
}

// Authenticates a user based on the request.
UserSchema.statics.authenticate = (
  request: Request,
  callback: (error: StatusError | null, correct: boolean, user: any) => void,
): void => {
  // Searches for user based on email provided
  UserModel.findOne({ username: request.body.username }).exec(
    (error: Error, user: any) => {
      if (error) {
        return callback(new StatusError(error.message), false, null)
      } else if (!user) {
        // If the user does not exist, send a 401 error.
        let error: StatusError = new StatusError('Incorrect username.', 401)
        return callback(error, false, null)
      }

      // If there is no error and user exists, the encrypted password provided is verified
      bcryptjs.compare(
        request.body.password,
        user.password,
        (error: any, same: boolean) => {
          // If the password is incorrect send a 401 error.
          // Send a 500 error for any other errors.
          if (error || !same) {
            let error: StatusError = new StatusError(
              'Failed to authenticate user.',
              500,
            )
            if (!same) {
              error = new StatusError('Incorrect password.', 401)
            }
            callback(error, false, null)
          } else {
            return callback(null, same, same ? user : null)
          }
        },
      )
    },
  )
}

// Called before a save is made
// to the database.
UserSchema.pre('save', function (next) {
  validate_users(this, next)
})

// Called before an update is made
// to the database.
UserSchema.pre('update', function (next) {
  validate_users(this, next)
})

/* -- SCHEMA PLUGINS -- */

UserSchema.plugin((schema) => {
  // This is responsible for removing
  // excess properties from the user
  // data that should be hidden from the
  // API, hiding deleted users, and filtering
  // users based on the current user's permissions.
  schema.query.queryForUsers = function (findFunctionName: 'find' | 'findOne') {
    // Get projection.
    let projection = this.projection()

    // Create if does not exist.
    if (projection === undefined) {
      projection = {}
    }

    // Remove all unneeded properties.
    if (!('deleted' in projection)) {
      projection['deleted'] = 0
    }
    if (!('__v' in projection)) {
      projection['__v'] = 0
    }
    if (!('password' in projection)) {
      projection['password'] = 0
    }

    // Set projection.
    this.projection(projection)
    // Hide deleted users.
    this.where({ deleted: false })

    // Calls the appropriate find function.
    switch (findFunctionName) {
      case 'find':
        return this.find()
      case 'findOne':
        return this.findOne()
    }
  }
})

UserSchema.plugin((schema) => {
  // This is responsible for filtering
  // users based on the current user's
  // permissions.
  schema.query.queryForFilteredUsers = function (
    findFunctionName: 'find' | 'findOne',
    currentUser?: ServerUser,
  ) {
    // Get projection.
    let projection = this.projection()

    // Create if does not exist.
    if (projection === undefined) {
      projection = {}
    }

    // Set projection.
    this.projection(projection)
    // Hide deleted users.
    this.where({ deleted: false })

    // Don't return the user currently
    // logged in if the find function
    // is for finding all users.
    if (findFunctionName === 'find') {
      this.where({ _id: { $ne: currentUser?._id } })
    }

    // If the user can only read students, hide all users
    // that are not students.
    if (
      currentUser?.isAuthorized('users_read_students') &&
      !currentUser.isAuthorized('users_read')
    ) {
      this.where({ accessId: { $eq: 'student' } })
    }

    // Calls the appropriate find function.
    switch (findFunctionName) {
      case 'find':
        return this.find()
      case 'findOne':
        return this.findOne()
    }
  }
})

/* -- MODEL -- */

const UserModel: any = mongoose.model('User', UserSchema)
export default UserModel
