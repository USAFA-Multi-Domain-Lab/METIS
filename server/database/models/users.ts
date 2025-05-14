import bcryptjs from 'bcryptjs'
import { Request } from 'express'
import ServerUser from 'metis/server/users'
import StringToolbox from 'metis/toolbox/strings'
import { TUserJson } from 'metis/users'
import { model, ProjectionType } from 'mongoose'
import { StatusError } from '../../http'
import { databaseLogger } from '../../logging'
import { UserSchema } from './classes'
import type {
  TPostUserQuery,
  TPreUserQuery,
  TUser,
  TUserDoc,
  TUserModel,
  TUserQueryOptions,
} from './types'

/* -- CONSTANTS -- */

/**
 * The collation to use when querying the database.
 * @note This collation is used to ensure that the database
 * queries are case-insensitive for the username field.
 * @see For more information, see the MongoDB documentation: [ https://www.mongodb.com/docs/manual/reference/collation ]
 */
const collation = { locale: 'en', strength: 2 }

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
 * Transforms the user document to JSON.
 * @param doc The mongoose document which is being converted.
 * @param ret The plain object representation which has been converted.
 * @param options The options in use.
 * @returns The JSON representation of a `User` document.
 */
const toJson = (doc: TUserDoc, ret: TUserJson, options: any): TUserJson => {
  return {
    ...ret,
    _id: doc.id,
    firstName: StringToolbox.capitalize(ret.firstName),
    lastName: StringToolbox.capitalize(ret.lastName),
  }
}

/**
 * Modifies the query to hide deleted users and remove unneeded properties.
 * @param query The query to modify.
 */
const queryForApiResponse = (query: TPreUserQuery): void => {
  // Extract options.
  const { includeDeleted = false } = query.getOptions() as TUserQueryOptions
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
  // Set the collation.
  query.collation(collation)
  // Hide deleted users.
  query.where({ deleted: { $eq: includeDeleted ? true : false } })
}

/**
 * Modifies the query to filter users based on the current user's permissions.
 * @param query The query to modify.
 */
const queryForFilteredUsers = (query: TPreUserQuery): void => {
  // Get projection.
  let projection = query.projection()
  // Extract options.
  let {
    currentUser,
    method,
    includeDeleted = false,
  } = query.getOptions() as TUserQueryOptions

  // Create if does not exist.
  if (projection === undefined) {
    projection = {}
  }

  // Set projection.
  query.projection(projection)
  // Hide deleted users.
  query.where({ deleted: { $eq: includeDeleted ? true : false } })

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
const authenticate = async (request: Request): Promise<TUserJson> => {
  return new Promise<TUserJson>(async (resolve, reject) => {
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
      let userJson: TUserJson = userDoc.toJSON()
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
  projection?: ProjectionType<TUser> | null,
  options?: TUserQueryOptions | null,
  updates?: Partial<TUserJson> | null,
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

/* -- SCHEMA -- */

/**
 * Represents the schema for a user in the database.
 * @see (Schema Generic Type Parameters) [ https://mongoosejs.com/docs/typescript/schemas.html#generic-parameters ]
 */
const Schema = new UserSchema(
  {
    username: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      validate: ServerUser.validateUsername,
      index: {
        collation: collation,
      },
    },
    accessId: {
      type: String,
      required: true,
      validate: ServerUser.validateAccessId,
    },
    expressPermissionIds: {
      type: [
        {
          type: String,
          required: true,
          validate: ServerUser.validateExpressPermissionId,
        },
      ],
      required: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
      validate: ServerUser.validateName,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      validate: ServerUser.validateName,
    },
    needsPasswordReset: { type: Boolean, required: true },
    password: {
      type: String,
      required: true,
      validate: ServerUser.validatePassword,
    },
    deleted: { type: Boolean, required: true, default: false },
  },
  {
    strict: 'throw',
    minimize: false,
    toJSON: {
      transform: toJson,
    },
    toObject: {
      transform: toJson,
    },
    statics: {
      authenticate,
      findByIdAndModify,
    },
    timestamps: true,
  },
)

/* -- SCHEMA MIDDLEWARE -- */

// Called before a save is made to the database.
Schema.pre<TUserDoc>('save', async function (next) {
  let user: TUserJson = this.toJSON()
  await ServerUser.validate(user, this.isNew, next)
  return next()
})

// Called before a find or update is made to the database.
Schema.pre<TPreUserQuery>(
  ['find', 'findOne', 'findOneAndUpdate', 'updateOne', 'updateMany'],
  function (next) {
    // Modify the query.
    queryForApiResponse(this)
    queryForFilteredUsers(this)
    // Call the next middleware.
    return next()
  },
)

// Converts ObjectIds to strings.
Schema.post<TPostUserQuery>(
  ['find', 'findOne', 'updateOne', 'findOneAndUpdate', 'updateMany'],
  function (userData: TUserDoc | TUserDoc[]) {
    // If the user is null, then return.
    if (!userData) return

    // Convert the user data to an array if it isn't already.
    userData = Array.isArray(userData) ? userData : [userData]

    // Transform the ObjectIds to strings.
    for (let userDatum of userData) {
      userDatum._id = userDatum.id
    }
  },
)

// Called after a save is made to the database.
Schema.post<TUserDoc>('save', function () {
  // Remove unneeded properties.
  this.set('__v', undefined)
  this.set('deleted', undefined)
  this.set('password', undefined)
})

/* -- MODEL -- */

/**
 * The mongoose model for a user in the database.
 */
const UserModel = model<TUser, TUserModel>('User', Schema)
export default UserModel
