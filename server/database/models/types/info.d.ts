import { Model } from 'mongoose'

/**
 * Represents an info object in the database.
 */
export type TInfo = {
  /**
   * The current build number that the schema is at.
   */
  schemaBuildNumber: number
}

/**
 * Represents the methods available for a `InfoModel`.
 */
export type TInfoMethods = {}

/**
 * Represents the static methods available for a `InfoModel`.
 */
export type TInfoStaticMethods = {}

/**
 * Represents a mongoose model for an info object in the database.
 */
export type TInfoModel = Model<TInfo, {}, TInfoMethods> & TInfoStaticMethods

/**
 * Represents a mongoose document for an info object in the database.
 */
export type TInfoDoc = Document<any, any, TInfo>
