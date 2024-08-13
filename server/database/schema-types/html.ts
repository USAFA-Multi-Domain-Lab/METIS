import DOMPurify from 'isomorphic-dompurify'
import { databaseLogger } from 'metis/server/logging'
import mongoose from 'mongoose'

/**
 * This is a custom schema type that
 * sanitizes HTML before it is saved
 * to the database.
 * @extends {mongoose.SchemaType}
 */
export class SanitizedHTML extends mongoose.SchemaType {
  /**
   * This is called when a new instance of the schema type
   * is created.
   * @param key The key of the schema type.
   * @param options The options passed to the schema type.
   */
  constructor(key: string, options: any) {
    super(key, options)
  }

  /**
   * This is called when a value is passed to the constructor.
   * @param val The value passed to the constructor.
   * @returns Sanitized HTML or an error.
   */
  cast(val: string): string | void {
    try {
      let sanitizedHTML = DOMPurify.sanitize(val, {
        ALLOWED_TAGS: ['a', 'br', 'p', 'strong', 'em', 'u', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: ['href', 'rel', 'target'],
        FORBID_TAGS: ['script', 'style', 'iframe'],
      })

      return sanitizedHTML
    } catch (error: any) {
      databaseLogger.error(error)
      throw new Error('Error sanitizing HTML.')
    }
  }
}

// This is responsible for adding
// the custom schema type to the
// mongoose namespace.
declare module 'mongoose' {
  namespace Schema.Types {
    class SanitizedHTML extends mongoose.SchemaType {
      constructor(key: string, options: any)
    }
  }
}

// This is responsible for registering
// the custom schema type.
mongoose.Schema.Types.SanitizedHTML = SanitizedHTML

export default SanitizedHTML
