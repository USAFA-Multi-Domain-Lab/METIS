import { TFileReferenceJson } from 'metis/files/references'
import { HydratedDocument, Model, Query } from 'mongoose'
import { TRecoverableDoc } from '.'

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

/* -- QUERY TYPES -- */

/**
 * The type for a pre-query middleware for a `FileReferenceModel`.
 */
export type TPreReferenceQuery = Query<TFileReference, TFileReference>

/**
 * The type for a post-query middleware for a `FileReferenceModel`.
 */
export type TPostReferenceQuery = Query<TFileReferenceDoc, TFileReferenceDoc>
