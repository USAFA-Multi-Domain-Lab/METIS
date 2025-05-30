import { TFileReferenceJson } from 'metis/files/references'
import { model, Schema } from 'mongoose'
import path from 'path'
import { buildToJson, excludeDeletedForFinds } from '.'
import MetisDatabase from '..'
import { FileReferenceSchema } from './classes'
import {
  TFileReference,
  TFileReferenceDoc,
  TFileReferenceModel,
  TPostReferenceQuery,
  TPreReferenceQuery,
} from './types'

/* -- FUNCTIONS -- */

/**
 * Transforms the document to JSON.
 * @param doc The mongoose document which is being converted.
 * @param ret The plain object representation which has been converted.
 * @param options The options in use.
 * @returns The JSON representation of a `FileReference` document.
 */
const toJson = buildToJson<TFileReferenceDoc, TFileReferenceJson>()

/**
 * Ensures that if the createdBy column is null,
 * it is populated with the proper user ID.
 * This is necessary because `null` indicates that
 * the user has been deleted, but the ID is still
 * needed for METIS to function properly.
 * @param reference The reference document to process.
 * @throws An error if the recursive query fails to
 * retrieve the necessary data.
 */
const ensureNoNullCreatedBy = async (reference: TFileReferenceDoc) => {
  // Quick scan to see if we even need to re-query.
  if (reference.createdBy !== null) return

  // Fetch unpopulated createdBy only.
  const unpopulated = await FileReferenceModel.findOne(
    { _id: reference._id },
    { createdBy: 1 },
    { populateCreatedBy: false },
  ).lean() // lean gives raw JS object

  if (!unpopulated) {
    throw MetisDatabase.generateValidationError(
      `Failed to find file-reference document with ID "${reference._id}".`,
    )
  }

  // Update the createdBy field with the
  // unpopulated value.
  reference.createdBy = unpopulated.createdBy
}

/* -- SCHEMA -- */

/**
 * Represents the schema for a file reference in the database.
 * @see (Schema Generic Type Parameters) [ https://mongoosejs.com/docs/typescript/schemas.html#generic-parameters ]
 */
const fileReferenceSchema = new FileReferenceSchema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      validate: () => {
        // todo: Add validation for filename.
        return true
      },
    },
    path: {
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
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdByUsername: {
      type: String,
      required: true,
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

/* -- SCHEMA INDEXES -- */

fileReferenceSchema.index(
  { name: 1 },
  {
    unique: true,
    partialFilterExpression: { deleted: false },
  },
)

/* -- SCHEMA MIDDLEWARE -- */

// Prevent deleted files from being returned in queries,
// unless explicitly requested.
excludeDeletedForFinds(fileReferenceSchema)

// Ensures that the file name is unique by appending
// a number to the end of the file name if it already
// exists.
fileReferenceSchema.pre('save', async function (next) {
  const file = this as TFileReferenceDoc

  if (!file.isNew && !file.isModified('name')) {
    return next()
  }

  const ext = path.extname(file.name)
  const base = path.basename(file.name, ext)

  let candidate = file.name
  let counter = 1

  while (
    await FileReferenceModel.exists({
      name: candidate,
      _id: { $ne: file._id },
    })
  ) {
    candidate = `${base} (${counter})${ext}`
    counter++
  }

  file.name = candidate
  next()
})

// Called before a find or update is made to the database.
fileReferenceSchema.pre<TPreReferenceQuery>(
  ['find', 'findOne', 'findOneAndUpdate', 'updateOne'],
  function (next) {
    const { populateCreatedBy = true } = this.getOptions()

    // Populate createdBy.
    if (populateCreatedBy) this.populate('createdBy')

    // Call the next middleware.
    return next()
  },
)

fileReferenceSchema.post<TPostReferenceQuery>(
  ['find', 'findOne', 'updateOne', 'findOneAndUpdate'],
  async function (referenceData: TFileReferenceDoc | TFileReferenceDoc[]) {
    // If the data is null, then return.
    if (!referenceData) return

    // Convert the data to an array if it isn't already.
    referenceData = !Array.isArray(referenceData)
      ? [referenceData]
      : referenceData

    for (let referenceDatum of referenceData) {
      // Confirm that no createdBy fields are null.
      await ensureNoNullCreatedBy(referenceDatum)
    }
  },
)

/* -- MODEL -- */

/**
 * The mongoose model for a file reference in the database.
 */
const FileReferenceModel = model<TFileReference, TFileReferenceModel>(
  'FileReference',
  fileReferenceSchema,
)

export default FileReferenceModel
