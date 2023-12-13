import mongoose, { Schema } from 'mongoose'
import bcryptjs from 'bcryptjs'
import { StatusError } from '../../http'
import { databaseLogger } from '../../logging'
import Role from '../schema-types/user-role'
import UserRole, { TUserRole } from 'metis/users/roles'
import UserPermission, { TUserPermission } from 'metis/users/permissions'
import Permission from '../schema-types/user-permission'
import { TCommonUser } from 'metis/users'
import { Request } from 'express'

let ObjectId = mongoose.Types.ObjectId

/* -- SCHEMA VALIDATORS -- */

// Validator for user.userID.
const validate_users_userID = (userID: string): boolean => {
  let userExpression: RegExp = /^([a-zA-Z0-9-_.]{5,25})$/
  let isValidUserID: boolean = userExpression.test(userID)

  return isValidUserID
}

// Validator for user.roleID.
const validate_users_roleID = (roleID: TUserRole['id']): boolean => {
  return UserRole.isValidRoleID(roleID)
}

// Validator for user.expressPermissionIDs.
const validate_users_expressPermissionIDs = (
  expressPermissionIDs: TUserPermission['id'][],
): boolean => {
  // Contains whether each permission is valid.
  let validExpressPermissionIDs: TUserPermission['id'][] = []

  // Loops through each permission and checks if it is valid.
  expressPermissionIDs.forEach((permissionID: TUserPermission['id']) => {
    // If it is valid, it is added to the array.
    if (UserPermission.isValidPermissionID(permissionID)) {
      validExpressPermissionIDs.push(permissionID)
    }
  })

  // If the valid express permissions array matches the
  // express permissions array that was passed, then all
  // permissions are valid.
  return validExpressPermissionIDs.length === expressPermissionIDs.length
}

// Validator for user.firstName and user.lastName.
const validate_users_name = (name: string): boolean => {
  let nameExpression: RegExp = /^([a-zA-Z']{1,25})$/
  let isValidName: boolean = nameExpression.test(name)

  return isValidName
}

const validator_users_password = (password: string): boolean => {
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
    userID: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      validate: validate_users_userID,
    },
    roleID: {
      type: Role,
      required: true,
      validate: validate_users_roleID,
    },
    expressPermissionIDs: {
      type: [Permission],
      required: true,
      validate: validate_users_expressPermissionIDs,
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
    _id: { type: ObjectId, required: false, auto: true },
    deleted: { type: Boolean, required: true, default: false },
  },
  {
    _id: false,
    strict: 'throw',
    minimize: false,
  },
)

/* -- SCHEMA METHODS -- */

/**
 * Hashes a password for storage in the database.
 * @param {string} password The password to hash.
 * @returns {Promise<string>} A promise that resolves to the hashed password.
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
  UserModel.findOne({ userID: request.body.userID }).exec(
    (error: Error, user: any) => {
      if (error) {
        return callback(new StatusError(error.message), false, null)
      } else if (!user) {
        return callback(null, false, null)
      }

      // If there is no error and user exists, the encrypted password provided is verified
      bcryptjs.compare(
        request.body.password,
        user.password,
        (error: any, same: boolean) => {
          if (error || !user) {
            let error: StatusError = new StatusError(
              'Failed to authenticate user.',
              500,
            )
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
  // API and for hiding deleted users.
  schema.query.queryForApiResponse = function (
    findFunctionName: 'find' | 'findOne',
  ) {
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
    if (!('_id' in projection)) {
      projection['_id'] = 0
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
  /**
   * This is responsible for hiding specific users based on the
   * current session's user and their role.
   * @param {TCommonUser} user The current session's user.
   * @returns {mongoose.Query} A mongoose query.
   * @deprecated
   */
  // todo: remove deprecated function
  schema.query.queryForApiResponseWithSpecificUsers = function (
    user: TCommonUser,
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
    // Hide current user in session.
    this.where({ userID: { $ne: user.userID } })
    // If the user is an instructor, only show students.
    if (user.role.id === 'instructor') {
      this.where({ roleID: { $eq: 'student' } })
    }
    // If the user is a student, do not return any users.
    if (user.role.id === 'student') {
      this.where({ userID: { $eq: '' } })
    }
    // If the user is not an admin, hide all admins and
    // revoked access users.
    if (user.role.id !== 'admin') {
      this.where({ roleID: { $ne: 'admin' } })
      this.where({ roleID: { $ne: 'revokedAccess' } })
    }

    return this
  }
})

/* -- MODEL -- */

const UserModel: any = mongoose.model('User', UserSchema)
export default UserModel
