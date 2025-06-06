import { TUserJson } from 'metis/users'

/**
 * A document that can be recovered, if need be,
 * since deletion is not permanent, rather it
 * is accomplished by the setting of a flag.
 * @param TJson The JSON representation of the document.
 */
export type TRecoverableDoc<TJson> = TJson & {
  /**
   * Whether the document has been deleted.
   */
  deleted: boolean
}

/**
 * A document that has a `createdBy` field,
 * which references the user who created it.
 */
export type TDocWithCreatedBy = {
  /**
   * The unique identifier of the document.
   */
  _id?: string
  /**
   * The user who created this document.
   */
  createdBy: TUserJson | string
}

export * from './file-references'
export * from './info'
export * from './missions'
export * from './users'
