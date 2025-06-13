import { Request } from 'express'
import { TUserExistingJson } from 'metis/users'
import {
  HydratedDocument,
  Model,
  ProjectionType,
  Query,
  QueryOptions,
} from 'mongoose'

/**
 * Represents a user in the database.
 * @see https://mongoosejs.com/docs/typescript/schemas.html#generic-parameters
 */
export type TUser = TUserJson & {
  /**
   * Determines if the user is deleted.
   */
  deleted: boolean
}

/**
 * Represents the methods available for a `UserModel`.
 * @see https://mongoosejs.com/docs/typescript/statics-and-methods.html
 */
export type TUserMethods = {}

/**
 * Represents the static methods available for a `UserModel`.
 * @see https://mongoosejs.com/docs/typescript/statics-and-methods.html
 */
export type TUserStaticMethods = {
  /**
   * Authenticates a user based on the request.
   * @param request The request with the user data.
   * @resolves When the user has been authenticated.
   * @rejects When the user could not be authenticated.
   */
  authenticate: (request: Request) => Promise<TUserExistingJson>
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
    projection?: ProjectionType<TUser> | null,
    options?: TUserQueryOptions | null,
    updates?: Partial<TUserJson> | null,
  ): Promise<TUserDoc | null>
}

/**
 * Represents a mongoose model for a user in the database.
 * @see https://mongoosejs.com/docs/typescript/schemas.html#generic-parameters
 */
export type TUserModel = Model<
  TUser,
  {},
  TUserMethods,
  TUserVirtuals,
  TUserDoc
> &
  TUserStaticMethods

/**
 * Represents a mongoose document for a user in the database.
 * @see https://mongoosejs.com/docs/typescript/schemas.html#generic-parameters
 */
export type TUserDoc = HydratedDocument<TUser, TUserMethods, TUserVirtuals>

/**
 * Represents the virtual properties for a user in the database.
 * @see https://mongoosejs.com/docs/tutorials/virtuals.html
 */
export type TUserVirtuals = {}

/* -- QUERY TYPES -- */

/**
 * The type for a pre-query middleware for a `UserModel`.
 */
export type TPreUserQuery = Query<TUser, TUser>

/**
 * The type for a post-query middleware for a `UserModel`.
 */
export type TPostUserQuery = Query<TUserDoc, TUserDoc>

/**
 * The available options within a query for a `UserModel`.
 */
export type TUserQueryOptions = QueryOptions<TUser> & {
  /**
   * The user currently logged in.
   */
  currentUser?: ServerUser
  /**
   * The middleware query method being used.
   */
  method?: MongooseQueryMiddleware
  /**
   * Determines if deleted users should be included in the results.
   */
  includeDeleted?: boolean
}
