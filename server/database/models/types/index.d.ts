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

export * from './file-references'
export * from './info'
export * from './missions'
export * from './users'
