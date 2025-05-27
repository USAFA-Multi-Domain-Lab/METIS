import { TFileReferenceJson } from 'metis/files/references'
import { model } from 'mongoose'
import path from 'path'
import { buildToJson, excludeDeletedForFinds } from '.'
import { FileReferenceSchema } from './classes'

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

/* -- MODEL -- */

/**
 * The mongoose model for a file reference in the database.
 */
const FileReferenceModel = model<TFileReference, TFileReferenceModel>(
  'FileReference',
  fileReferenceSchema,
)

export default FileReferenceModel
