import { TFileReferenceJson } from 'metis/files/references'
import {
  DefaultSchemaOptions,
  HydratedDocument,
  Model,
  model,
  Schema,
} from 'mongoose'
import { buildToJson, excludeDeletedForFinds, TRecoverableDoc } from '.'

/* -- FUNCTIONS -- */

/**
 * Transforms the document to JSON.
 * @param doc The mongoose document which is being converted.
 * @param ret The plain object representation which has been converted.
 * @param options The options in use.
 * @returns The JSON representation of a `FileReference` document.
 */
const toJson = buildToJson<TFileReferenceDoc, TFileReferenceJson>()

/* -- SCHEMA -- */

/**
 * Represents the schema for a file reference in the database.
 * @see (Schema Generic Type Parameters) [ https://mongoosejs.com/docs/typescript/schemas.html#generic-parameters ]
 */
const FileReferenceSchema = new Schema<
  TFileReference,
  TFileReferenceModel,
  TFileReferenceMethods,
  {},
  TFileReferenceVirtuals,
  TFileReferenceStaticMethods,
  DefaultSchemaOptions,
  TFileReferenceDoc
>(
  {
    name: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      validate: () => {
        // todo: Add validation for filename.
        return true
      },
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
      validate: () => {
        // todo: Add validation for original filename.
        return true
      },
    },
    mimetype: {
      type: String,
      required: true,
      trim: true,
      validate: () => {
        // todo: Add validation for mimetype.
        return true
      },
    },
    size: {
      type: Number,
      required: true,
      validate: () => {
        // todo: Add validation for size.
        return true
      },
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
    statics: {},
    timestamps: true,
  },
)

/* -- SCHEMA MIDDLEWARE -- */

// Prevent deleted files from being returned in queries,
// unless explicitly requested.
excludeDeletedForFinds(FileReferenceSchema)

/* -- SCHEMA TYPES -- */

/**
 * A file reference stored in the database, which
 * includes the location and the metadata for a file
 * stored within in the METIS file store.
 * @see https://mongoosejs.com/docs/typescript/schemas.html#generic-parameters
 */
type TFileReference = TRecoverableDoc<TFileReferenceJson>

/**
 * Represents the methods available for a `FileReferenceModel`.
 * @see https://mongoosejs.com/docs/typescript/statics-and-methods.html
 */
type TFileReferenceMethods = {}

/**
 * Represents the static methods available for a `FileReferenceModel`.
 * @see https://mongoosejs.com/docs/typescript/statics-and-methods.html
 */
type TFileReferenceStaticMethods = {}

/**
 * Represents a mongoose model for a file reference in the database.
 * @see https://mongoosejs.com/docs/typescript/schemas.html#generic-parameters
 */
type TFileReferenceModel = Model<
  TFileReference,
  {},
  TFileReferenceMethods,
  TFileReferenceVirtuals,
  TFileReferenceDoc
> &
  TFileReferenceStaticMethods

/**
 * Represents a mongoose document for a file reference in the database.
 * @see https://mongoosejs.com/docs/typescript/schemas.html#generic-parameters
 */
type TFileReferenceDoc = HydratedDocument<
  TFileReference,
  TFileReferenceMethods,
  TFileReferenceVirtuals
>

/**
 * Represents the virtual properties for a file reference in the database.
 * @see https://mongoosejs.com/docs/tutorials/virtuals.html
 */
type TFileReferenceVirtuals = {}

/* -- MODEL -- */

/**
 * The mongoose model for a file reference in the database.
 */
const FileReferenceModel = model<TFileReference, TFileReferenceModel>(
  'FileReference',
  FileReferenceSchema,
)

export default FileReferenceModel
