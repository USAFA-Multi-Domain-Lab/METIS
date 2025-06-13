import { TUserJson } from 'metis/users'
import mongoose from 'mongoose'

/**
 * A document that can be recovered, if need be,
 * since deletion is not permanent, rather it
 * is accomplished by the setting of a flag.
 * @param TJson The JSON representation of the document.
 */
export type TMetisDoc<TJson extends {} = {}> = TJson & {
  /**
   * The unique identifier of the document.
   */
  _id?: string
  /**
   * The creator of the document.
   */
  createdBy?: TUserJson | mongoose.Types.ObjectId
  /**
   * Whether the document has been deleted.
   */
  deleted: boolean
}

export * from './file-references'
export * from './info'
export * from './missions'
export * from './users'
