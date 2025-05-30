import { TMetisComponentJson } from 'metis/index'
import { HydratedDocument, Model, Schema } from 'mongoose'
import { TRecoverableDoc } from './types'

/**
 * Factory for creating a JSON converter for a Mongoose document.
 * @returns the JSON converter function.
 */
export const buildToJson = <
  TDoc extends HydratedDocument<TRecoverableDoc<TJson>, {}, {}>,
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
 * utilize the `TRecoverableDoc` interface.
 * @param schema The schema to which the pre-hook will be added.
 */
export const excludeDeletedForFinds = <
  TSchema extends Schema<TRecoverableDoc<any>, Model<TRecoverableDoc<any>>>,
>(
  schema: TSchema,
): void => {
  schema.pre(
    ['find', 'findOne', 'findOneAndUpdate', 'updateOne'],
    function (next) {
      const { includeDeleted = false } = this.getOptions()

      // If includeDeleted is false, filter out deleted documents
      // from the query.
      if (!includeDeleted) {
        this.where({ deleted: false })
      }

      // Default projection logic
      let projection = this.projection() ?? {}
      if (Object.keys(projection).length === 0) {
        projection = {
          deleted: 0,
          __v: 0,
        }
      }

      this.projection(projection)
      return next()
    },
  )
}

export { TRecoverableDoc }
