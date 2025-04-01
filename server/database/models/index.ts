import { TMetisComponent } from 'metis/index'
import { HydratedDocument, Model, Schema } from 'mongoose'
import { TRecoverableDoc } from './index.d'

/**
 * Factory for creating a JSON converter for a Mongoose document.
 * @returns the JSON converter function.
 */
export const buildToJson = <
  TDoc extends HydratedDocument<TRecoverableDoc<TJson>, {}, {}>,
  TJson extends TMetisComponent,
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
      // Get projection.
      let projection = this.projection()

      // Create if does not exist.
      if (projection === undefined) {
        projection = {}
      }

      // Check if the projection is empty.
      let projectionKeys = Object.keys(projection)

      // If the projection is empty, create a default projection.
      if (projectionKeys.length === 0) {
        projection = {
          deleted: 0,
          __v: 0,
        }
      }

      // Set projection.
      this.projection(projection)
      // Hide deleted missions.
      this.where({ deleted: false })

      // Call the next middleware.
      return next()
    },
  )
}

export { TRecoverableDoc }
