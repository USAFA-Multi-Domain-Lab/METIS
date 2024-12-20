import { Document, Model, model, Schema } from 'mongoose'

const InfoSchema: Schema = new Schema<TInfo, TInfoModel, TInfoMethods>(
  {
    schemaBuildNumber: { type: Number, required: true },
  },
  {
    strict: 'throw',
    minimize: false,
    toJSON: {
      transform: function (doc, ret) {
        delete ret._id
      },
    },
  },
)

/* -- SCHEMA TYPES -- */

/**
 * Represents an info object in the database.
 */
type TInfo = {
  /**
   * The current build number that the schema is at.
   */
  schemaBuildNumber: number
}

/**
 * Represents the methods available for a `InfoModel`.
 */
type TInfoMethods = {}

/**
 * Represents the static methods available for a `InfoModel`.
 */
type TInfoStaticMethods = {}

/**
 * Represents a mongoose model for an info object in the database.
 */
type TInfoModel = Model<TInfo, {}, TInfoMethods> & TInfoStaticMethods

/**
 * Represents a mongoose document for an info object in the database.
 */
export type TInfoDoc = Document<any, any, TInfo>

/* -- MODEL -- */
const InfoModel = model<TInfo, TInfoModel>('Info', InfoSchema)
export default InfoModel
