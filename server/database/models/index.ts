import { TMetisComponentJson } from 'metis/index'
import { HydratedDocument, Model, Query, Schema } from 'mongoose'
import MetisDatabase from '..'
import { TMetisDoc } from './types'

/**
 * Factory for creating a JSON converter for a Mongoose document.
 * @returns the JSON converter function.
 */
export const buildToJson = <
  TDoc extends HydratedDocument<TMetisDoc<TJson>, {}, {}>,
  TJson extends TMetisComponentJson,
>() => {
  return (doc: TDoc, ret: TJson, options: any) => {
    return {
      ...ret,
      _id: doc.id,
    }
  }
}

/**
 * Adds a pre-hook to the given schema to exclude deleted documents
 * from the results of find queries. This only applies to schemas that
 * utilize the `TRecoverableDoc` interface. The `includeDeleted` option
 * can be set to true on the query to override this behavior.
 * @param schema The schema to which the pre-hook will be added.
 */
export const excludeDeletedForFinds = <
  TSchema extends Schema<TMetisDoc<any>, Model<TMetisDoc<any>>>,
>(
  schema: TSchema,
): void => {
  schema.pre(
    ['find', 'findOne', 'findOneAndUpdate', 'updateOne'],
    function (next) {
      // Abort if the includeDeleted option is set to true.
      const { includeDeleted = false } = this.getOptions()
      if (includeDeleted) return next()

      // Apply condition to exclude deleted documents.
      this.where({ deleted: false })

      return next()
    },
  )
}

/**
 * Adds a pre-hook to the given query to exclude properties
 * that should not be exposed to the client. This behavior can
 * be overridden by setting the `includeSensitive` option
 * to true on the query.
 * @param schema The schema to which the pre-hook will be added.
 * @param additionalFields Additional fields to exclude from the query,
 * besides the default `deleted` and `__v` fields.
 */
export const excludeSensitiveForFinds = <
  TSchema extends Schema<TMetisDoc<any>, Model<TMetisDoc<any>>>,
>(
  schema: TSchema,
  additionalFields: string[] = [],
): void => {
  schema.pre(
    ['find', 'findOne', 'findOneAndUpdate', 'updateOne'],
    function (next) {
      // Abort if sensitive data is marked as
      // needing to be included.
      const { includeSensitive = false } = this.getOptions()
      if (includeSensitive) return next()

      // Get projection.
      let projection = this.projection()

      // Create if does not exist.
      if (projection === undefined) {
        projection = {}
      }

      // If inclusion exists the projection, then
      // there is no need to apply exclusion projection.
      if (Object.values(projection).some((value) => value === 1)) {
        return next()
      }

      // Apply projections.
      projection.deleted = 0
      projection.__v = 0

      for (const field of additionalFields) {
        projection[field] = 0
      }

      // Set projection.
      this.projection(projection)

      return next()
    },
  )
}

/**
 * Populates the `createdBy` field in the query if
 * the `populateCreatedBy` option of the query is set
 * to true.
 * @param query The query to modify.
 * @note This will not recursively populate the `createdBy`
 * field to avoid infinite loops.
 */
export const populateCreatedByIfFlagged = <
  TQuery extends Query<TMetisDoc, TMetisDoc>,
>(
  query: TQuery,
) => {
  // Get options and filter passed to the query.
  const { populateCreatedBy = true } = query.getOptions()
  const projection = query.projection()
  const createdBySelected = !projection || projection.createdBy === 1

  // If the query isn't recursive and createdBy is
  // marked to be populated, then populate it.
  if (populateCreatedBy && createdBySelected) {
    query.populate({
      path: 'createdBy',
      select: '-preferences -password -expressPermissionIds',
      options: { populateCreatedBy: false },
    })
  }
}

/**
 * Ensures that if the createdBy column is null,
 * it is populated with the proper document ID.
 * This is necessary because `null` indicates that
 * the document has been deleted, but the ID is still
 * needed for METIS to function properly.
 * @param doc The reference document to process.
 * @param model The model used to recursively query
 * the document as a lean document.
 * @throws An error if the recursive query fails to
 * retrieve the necessary data.
 */
export const ensureNoNullCreatedBy = async <TDoc extends TMetisDoc>(
  doc: TDoc,
  model: Model<TDoc>,
) => {
  // Quick scan to see if we even need to re-query.
  if (doc.createdBy !== null) return

  // Fetch unpopulated createdBy only.
  const unpopulated = await model
    .findOne(
      { _id: doc._id },
      { createdBy: 1 },
      { populateCreatedBy: false, includeDeleted: true },
    )
    .lean() // lean gives raw JS object

  if (!unpopulated) {
    throw MetisDatabase.generateValidationError(
      `Failed to find document with ID "${doc._id}".`,
    )
  }

  // Update the createdBy field with the
  // unpopulated value.
  doc.createdBy = unpopulated.createdBy
}

export { TMetisDoc }
