import { databaseLogger } from 'metis/server/logging'
import UserPermission, { TUserPermission } from 'metis/users/permissions'
import mongoose from 'mongoose'

/**
 * This is a custom schema type for user permissions.
 * @extends {mongoose.SchemaType}
 */
export class Permission extends mongoose.SchemaType {
  /**
   * This is called when a new instance of the schema type
   * is created.
   * @param {string} key The key of the schema type.
   * @param {any} options The options passed to the schema type.
   */
  constructor(key: string, options: any) {
    super(key, options)
  }

  /**
   * This is called when a value is passed to the constructor.
   * @param {TUserPermission['id']} permissionID The value passed to the constructor.
   * @returns {TUserPermission['id']} A user permission ID or an error.
   */
  public cast(permissionID: TUserPermission['id']): TUserPermission['id'] {
    // Checks to make sure the permission ID that's passed
    // is valid.
    let isValidPermissionID: boolean =
      UserPermission.isValidPermissionID(permissionID)

    // Checks if the permission parameter is a valid permission.
    if (isValidPermissionID) {
      return permissionID
    } else {
      databaseLogger.error(`Invalid user permission ID: ${permissionID}`)
      throw new Error(`Invalid user permission ID: ${permissionID}`)
    }
  }
}

// This is responsible for adding
// the custom schema type to the
// mongoose namespace.
declare module 'mongoose' {
  namespace Schema.Types {
    class Permission extends mongoose.SchemaType {
      constructor(key: string, options: any)
    }
  }
}

// This is responsible for registering
// the custom schema type.
mongoose.Schema.Types.Permission = Permission

export default Permission
