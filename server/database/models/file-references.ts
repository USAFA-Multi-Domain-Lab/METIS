import type { TFileReferenceJson } from '@shared/files/FileReference'
import { model, Schema } from 'mongoose'
import path from 'path'
import {
  buildToJson,
  ensureNoNullCreatedBy,
  excludeDeletedForFinds,
  excludeSensitiveForFinds,
  populateCreatedByIfFlagged,
} from '.'
import { ServerFileReference } from '../../files/ServerFileReference'
import { FileReferenceSchema } from './classes'
import type {
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
      maxLength: ServerFileReference.MAX_NAME_LENGTH,
    },
    path: {
      type: String,
      required: true,
      trim: true,
    },
    mimetype: {
      type: String,
      required: true,
      trim: true,
      validate: ServerFileReference.validateMimetype,
    },
    size: {
      type: Number,
      required: true,
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

// Exclude sensitive information by default from query
// results.
excludeSensitiveForFinds(fileReferenceSchema)
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
    // Populate createdBy.
    populateCreatedByIfFlagged(this)
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
      await ensureNoNullCreatedBy(referenceDatum, FileReferenceModel)
    }
  },
)

/* -- MODEL -- */

/**
 * The mongoose model for a file reference in the database.
 */
export const FileReferenceModel = model<TFileReference, TFileReferenceModel>(
  'FileReference',
  fileReferenceSchema,
)
