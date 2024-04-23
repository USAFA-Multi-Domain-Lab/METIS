import bcryptjs from 'bcryptjs'
import { Request } from 'express'
import ServerUser from 'metis/server/users'
import User, { TCommonUserJson } from 'metis/users'
import UserPermission, { TUserPermission } from 'metis/users/permissions'
import UserRole, { TUserRole } from 'metis/users/roles'
import mongoose, { Schema } from 'mongoose'
import { StatusError } from '../../http'
import { databaseLogger } from '../../logging'
import Permission from '../schema-types/user-permission'
import Role from '../schema-types/user-role'

/* -- SCHEMA VALIDATORS -- */

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
 * Validates the role ID of a user.
 * @param roleId The role ID to validate.
 */
const validate_users_roleId = (roleId: TUserRole['_id']): boolean => {
  return UserRole.isValidRoleId(roleId)
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
  let nameExpression: RegExp = /^([a-zA-Z']{1,25})$/
  let isValidName: boolean = nameExpression.test(name)

  return isValidName
}

/**
 * Validates a hashed password.
 * @param password The password to validate.
 */
const validator_users_password = (
  password: NonNullable<TCommonUserJson['password']>,
): boolean => {
  // This is an expression to validate a hashed password.
  // This is not for validating the password that the user
  // submits.
  let passwordExpression: RegExp = /^\$2[ayb]\$.{56}$/
  let isValidPassword: boolean = passwordExpression.test(password)

  return isValidPassword
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
    roleId: {
      type: Role,
      required: true,
      validate: validate_users_roleId,
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
    sessionUser?: ServerUser,
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

    // Don't return the current user in
    // session if the find function is
    // for finding all users.
    if (findFunctionName === 'find') {
      this.where({ _id: { $ne: sessionUser?._id } })
    }

    // If the user can only read students, hide all users
    // that are not students.
    if (
      sessionUser?.isAuthorized('users_read_students') &&
      !sessionUser.isAuthorized('users_read')
    ) {
      this.where({ roleId: { $eq: 'student' } })
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
