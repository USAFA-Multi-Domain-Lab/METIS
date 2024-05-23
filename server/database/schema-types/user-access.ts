import { databaseLogger } from 'metis/server/logging'
import UserAccess, { TUserAccess } from 'metis/users/accesses'
import mongoose from 'mongoose'

/**
 * This is a custom schema type for user accesses.
 * @extends {mongoose.SchemaType}
 */
export class Access extends mongoose.SchemaType {
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
   * @param accessId The value passed to the constructor.
   * @returns A user access ID or an error.
   */
  public cast(accessId: TUserAccess['_id']): TUserAccess['_id'] {
    // Checks to make sure the access ID that's passed
    // is valid.
    let isValidAccessId: boolean = UserAccess.isValidAccessId(accessId)

    // Checks if the access parameter is a valid access.
    if (isValidAccessId) {
      return accessId
    } else {
      databaseLogger.error(`Invalid user access ID: ${accessId}`)
      throw new Error(`Invalid user access ID: ${accessId}`)
    }
  }
}

// This is responsible for adding
// the custom schema type to the
// mongoose namespace.
declare module 'mongoose' {
  namespace Schema.Types {
    class Access extends mongoose.SchemaType {
      constructor(key: string, options: any)
    }
  }
}

// This is responsible for registering
// the custom schema type.
mongoose.Schema.Types.Access = Access

export default Access
