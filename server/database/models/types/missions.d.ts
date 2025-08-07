import { TMissionSaveJson } from 'metis/missions'
import {
  HydratedDocument,
  Model,
  ProjectionType,
  Query,
  QueryOptions,
} from 'mongoose'
import { TMetisDoc } from '..'

/**
 * Represents a mission in the database.
 * @see https://mongoosejs.com/docs/typescript/schemas.html#generic-parameters
 */
export type TMission = TMetisDoc<TMissionSaveJson>

/**
 * Represents the methods available for a `MissionModel`.
 * @see https://mongoosejs.com/docs/typescript/statics-and-methods.html
 */
export type TMissionMethods = {}

/**
 * Represents the static methods available for a `MissionModel`.
 * @see https://mongoosejs.com/docs/typescript/statics-and-methods.html
 */
export type TMissionStaticMethods = {
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
   * @note This method will trigger the `pre('save')` middleware which validates the mission.
   */
  findByIdAndModify(
    _id: any,
    projection?: ProjectionType<TMission> | null,
    options?: QueryOptions<TMission> | null,
    updates?: Partial<TMissionSaveJson> | null,
  ): Promise<TMissionDoc | null>
}

/**
 * Represents a mongoose model for a mission in the database.
 * @see https://mongoosejs.com/docs/typescript/schemas.html#generic-parameters
 */
export type TMissionModel = Model<
  TMission,
  {},
  TMissionMethods,
  TMissionVirtuals,
  TMissionDoc
>

/**
 * Represents a mongoose document for a mission in the database.
 * @see https://mongoosejs.com/docs/typescript/schemas.html#generic-parameters
 */
export type TMissionDoc = HydratedDocument<
  TMission,
  TMissionMethods,
  TMissionVirtuals
>

/**
 * Represents the virtual properties for a mission in the database.
 * @see https://mongoosejs.com/docs/tutorials/virtuals.html
 */
export type TMissionVirtuals = {}

/* -- QUERY TYPES -- */

/**
 * The type for a pre-query middleware for a `MissionModel`.
 */
export type TPreMissionQuery = Query<TMission, TMission>

/**
 * The type for a post-query middleware for a `MissionModel`.
 */
export type TPostMissionQuery = Query<TMissionDoc, TMissionDoc>
export type TPostMissionQuery = Query<TMissionDoc, TMissionDoc>
