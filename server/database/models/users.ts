import bcryptjs from 'bcryptjs'
import { Request } from 'express'
import ServerUser from 'metis/server/users'
import { AnyObject } from 'metis/toolbox/objects'
import User, { TCommonUserJson } from 'metis/users'
import UserAccess, { TUserAccess } from 'metis/users/accesses'
import UserPermission, { TUserPermission } from 'metis/users/permissions'
import mongoose, {
  CallbackWithoutResultAndOptionalError,
  Document,
  Model,
  model,
  MongooseQueryMiddleware,
  ProjectionType,
  Query,
  QueryOptions,
  Schema,
} from 'mongoose'
import MetisDatabase from '..'
import { StatusError } from '../../http'
import { databaseLogger } from '../../logging'

let ObjectId = mongoose.Types.ObjectId

/* -- FUNCTIONS -- */

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

/**
 * Transforms the ObjectId to a string.
 * @param doc The mongoose document which is being converted.
 * @param ret The plain object representation which has been converted.
 * @param options The options in use.
 * @returns
 */
const transformObjectIdToString = (
  doc: TUserDoc,
  ret: TCommonUserJson,
  options: any,
) => {
  if (ret._id) ret._id = ret._id.toString()
  return ret
}

/**
 * Modifies the query to hide deleted users and remove unneeded properties.
 * @param query The query to modify.
 */
const queryForApiResponse = (query: Query<TUserSchema, TUserModel>): void => {
  // Get projection.
  let projection = query.projection()

  // Create if does not exist.
  if (projection === undefined) {
    projection = {}
  }

  // Check if the projection is empty.
  let projectionKeys = Object.keys(projection)

  // If the projection is empty, create a default projection.
  if (projectionKeys.length === 0) {
    projection = {
      password: 0,
      deleted: 0,
      __v: 0,
    }
  }

  // Set projection.
  query.projection(projection)
  // Hide deleted users.
  query.where({ deleted: false })
}

/**
 * Modifies the query to filter users based on the current user's permissions.
 * @param query The query to modify.
 */
const queryForFilteredUsers = (query: Query<TUserSchema, TUserModel>): void => {
  // Get projection.
  let projection = query.projection()
  // Extract options.
  let { currentUser, method } = query.getOptions() as TUserQueryOptions

  // Create if does not exist.
  if (projection === undefined) {
    projection = {}
  }

  // Set projection.
  query.projection(projection)
  // Hide deleted users.
  query.where({ deleted: false })

  // Don't return the user currently
  // logged in if the find function
  // is for finding all users.
  if (method === 'find') {
    query.where({ _id: { $ne: currentUser?._id } })
  }

  // If the user can only read students, hide all users
  // that are not students.
  if (
    currentUser?.isAuthorized('users_read_students') &&
    !currentUser.isAuthorized('users_read')
  ) {
    query.where({ accessId: { $eq: 'student' } })
  }
}

/* -- SCHEMA STATIC FUNCTIONS -- */

/**
 * Authenticates a user based on the request.
 * @param request The request with the user data.
 * @resolves When the user has been authenticated.
 * @rejects When the user could not be authenticated.
 */
const authenticate = async (request: Request): Promise<TCommonUserJson> => {
  return new Promise<TCommonUserJson>(async (resolve, reject) => {
    try {
      // Extract user data from the request.
      let { username, password } = request.body
      // Find the user in the database.
      let userDoc = await UserModel.findOne(
        { username },
        {
          username: 1,
          accessId: 1,
          expressPermissionIds: 1,
          firstName: 1,
          lastName: 1,
          needsPasswordReset: 1,
          password: 1,
        },
      ).exec()
      // If the user does not exist, throw an error.
      if (!userDoc) {
        throw new StatusError('Incorrect username.', 401)
      }

      // If the user does not have a password, throw an error.
      if (!userDoc.password) {
        throw new StatusError(
          `Failed to authenticate user because the user "{ username: ${username} }" does not have a password.`,
          500,
        )
      }

      // Compare the password to the hashed password.
      let same: boolean = await bcryptjs.compare(password, userDoc.password)
      // If the password is incorrect, then return an error.
      if (!same) throw new StatusError('Incorrect password.', 401)

      // Convert the user document to JSON.
      let userJson: TCommonUserJson = userDoc.toJSON()
      // Return the user.
      resolve(userJson)
    } catch (error: any) {
      // Log the error.
      databaseLogger.error('Failed to authenticate user.\n', error)
      // If there was an error, return the error.
      reject(error)
    }
  })
}

/**
 * Finds a single document by its `_id` field. Then, if the
 * document is found, modifies the document with the given
 * updates using the `save` method.
 * @param _id The _id of the document to find.
 * @param projection The projection to use when finding the document.
 * @param options The options to use when finding the document.
 * @param updates The updates to apply to the document.
 * @resolves The modified document.
 * @rejects An error if the document is not found or is deleted.
 * @note This method uses the `findById` method internally followed by the `save` method (if the document is found).
 * @note This method will trigger the `pre('save')` middleware which validates the user.
 */
const findByIdAndModify = (
  _id: any,
  projection?: ProjectionType<TUserSchema> | null,
  options?: TUserQueryOptions | null,
  updates?: Partial<TCommonUserJson> | null,
): Promise<TUserDoc | null> => {
  return new Promise<TUserDoc | null>(async (resolve, reject) => {
    try {
      // Find the user document.
      let userDoc = await UserModel.findById(_id, projection, options).exec()

      // If the user is not found, then resolve with null.
      if (!userDoc) return resolve(userDoc)

      // Extract the updated properties.
      let { _id: userId, ...rest } = updates ?? {}
      // Update every property besides the _id.
      Object.assign(userDoc, { ...rest })
      // Save the changes.
      userDoc = await userDoc.save()

      // Otherwise, resolve with the user document.
      return resolve(userDoc)
    } catch (error: any) {
      // Reject the promise with the error.
      return reject(error)
    }
  })
}

/* -- SCHEMA VALIDATORS -- */

/**
 * Validates the user data.
 * @param userJson The user data to validate.
 * @param next The next function to call.
 */
const validate_users = (
  userJson: Partial<TCommonUserJson>,
  next: CallbackWithoutResultAndOptionalError,
): void => {
  // Object to store results.
  let results: { error?: Error } = {}
  // Object to store existing _id's.
  let existingIds: AnyObject = {}

  // Algorithm to check for duplicate _id's.
  const _idCheckerAlgorithm = (
    cursor: AnyObject | AnyObject[] = userJson,
  ): { error?: Error } => {
    // If the cursor is an object, not an array, and not an ObjectId...
    if (
      cursor instanceof Object &&
      !Array.isArray(cursor) &&
      !(cursor instanceof ObjectId)
    ) {
      // ...and it has an _id property and the _id already exists...
      if (cursor._id && cursor._id in existingIds) {
        // ...then set the error and return.
        let error = new Error(
          `Error in user:\nDuplicate _id used (${cursor._id}).`,
        )
        error.name = MetisDatabase.ERROR_BAD_DATA
        return { error }
      }
      // Or, if the cursor is a User and the _id isn't a valid ObjectId...
      else if (
        cursor instanceof User &&
        !mongoose.isObjectIdOrHexString(cursor._id)
      ) {
        // ...then set the error and return.
        let error = new Error(
          `Error in user:\nInvalid _id used (${cursor._id}).`,
        )
        error.name = MetisDatabase.ERROR_BAD_DATA
        return { error }
      }
      // Otherwise, add the _id to the existingIds object.
      else if (cursor._id) {
        existingIds[cursor._id] = true
      }

      // Check the object's values for duplicate _id's.
      for (let value of Object.values(cursor)) {
        let results = _idCheckerAlgorithm(value)
        if (results.error) return results
      }
    }
    // Otherwise, if the cursor is an array...
    else if (Array.isArray(cursor)) {
      // ...then check each value in the array for duplicate _id's.
      for (let value of cursor) {
        let results = _idCheckerAlgorithm(value)
        if (results.error) return results
      }
    }

    // Return an empty object.
    return {}
  }

  // Check for duplicate _id's.
  results = _idCheckerAlgorithm()
  // Check for error.
  if (results.error) return next(results.error)
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
 * Validates the express permission ID of a user.
 * @param expressPermissionId The express permission ID to validate.
 */
const validate_users_expressPermissionId = (
  expressPermissionId: TUserPermission['_id'],
): boolean => {
  return UserPermission.isValidPermissionId(expressPermissionId)
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

const UserSchema = new Schema<TUserSchema, TUserModel, TUserMethods>(
  {
    username: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      validate: validate_users_username,
    },
    accessId: {
      type: String,
      required: true,
      validate: validate_users_accessId,
    },
    expressPermissionIds: {
      type: [
        {
          type: String,
          required: true,
          validate: validate_users_expressPermissionId,
        },
      ],
      required: true,
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
    toJSON: {
      transform: transformObjectIdToString,
    },
    toObject: {
      transform: transformObjectIdToString,
    },
    statics: {
      authenticate,
      findByIdAndModify,
    },
  },
)

/* -- SCHEMA MIDDLEWARE -- */

// Called before a save is made to the database.
UserSchema.pre<TUserDoc>('save', function (next) {
  let user: TCommonUserJson = this.toJSON()
  validate_users(user, next)
  return next()
})

// Called before a find or update is made to the database.
UserSchema.pre<Query<TUserSchema, TUserModel>>(
  ['find', 'findOne', 'findOneAndUpdate', 'updateOne'],
  function (next) {
    // Modify the query.
    queryForApiResponse(this)
    queryForFilteredUsers(this)
    // Call the next middleware.
    return next()
  },
)

// Converts ObjectIds to strings.
UserSchema.post<Query<TUserSchema, TUserModel>>(
  ['find', 'findOne', 'updateOne', 'findOneAndUpdate'],
  function (userData: TUserSchema | TUserSchema[]) {
    // If the user is null, then return.
    if (!userData) return

    // Convert the user data to an array if it isn't already.
    userData = Array.isArray(userData) ? userData : [userData]

    // Transform the ObjectIds to strings.
    for (let userDatum of userData) {
      userDatum._id = userDatum._id?.toString()
    }
  },
)

// Called after a save is made to the database.
UserSchema.post<TUserDoc>('save', function () {
  // Remove unneeded properties.
  this.set('__v', undefined)
  this.set('deleted', undefined)
  this.set('password', undefined)
})

/* -- SCHEMA TYPES -- */

/**
 * Represents a user in the database.
 */
type TUserSchema = TCommonUserJson & {
  /**
   * Determines if the user is deleted.
   */
  deleted: boolean
}

/**
 * Represents the methods available for a `UserModel`.
 */
type TUserMethods = {}

/**
 * Represents the static methods available for a `UserModel`.
 */
type TUserStaticMethods = {
  /**
   * Authenticates a user based on the request.
   * @param request The request with the user data.
   * @resolves When the user has been authenticated.
   * @rejects When the user could not be authenticated.
   */
  authenticate: (request: Request) => Promise<TCommonUserJson>
  /**
   * Finds a single document by its `_id` field. Then, if the
   * document is found, modifies the document with the given
   * updates using the `save` method.
   * @param _id The _id of the document to find.
   * @param projection The projection to use when finding the document.
   * @param options The options to use when finding the document.
   * @param updates The updates to apply to the document.
   * @resolves The modified document.
   * @rejects An error if the document is not found or is deleted.
   * @note This method uses the `findById` method internally followed by the `save` method (if the document is found).
   * @note This method will trigger the `pre('save')` middleware which validates the user.
   */
  findByIdAndModify(
    _id: any,
    projection?: ProjectionType<TUserSchema> | null,
    options?: TUserQueryOptions | null,
    updates?: Partial<TCommonUserJson> | null,
  ): Promise<TUserDoc | null>
}

/**
 * Represents a mongoose model for a user in the database.
 */
type TUserModel = Model<TUserSchema, {}, TUserMethods> & TUserStaticMethods

/**
 * Represents a mongoose document for a user in the database.
 */
type TUserDoc = Document<any, any, TUserSchema>

/**
 * The available options within a query for a user model.
 */
type TUserQueryOptions = QueryOptions<TUserSchema> & {
  /**
   * The user currently logged in.
   */
  currentUser?: ServerUser
  /**
   * The middleware query method being used.
   */
  method?: MongooseQueryMiddleware
}

/* -- MODEL -- */

/**
 * The mongoose model for a user in the database.
 */
const UserModel = model<TUserSchema, TUserModel>('User', UserSchema)
export default UserModel
