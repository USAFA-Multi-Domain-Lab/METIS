import { databaseLogger } from 'metis/server/logging'
import { IUserPermissionJSON, TUserPermissionID } from 'metis/users/permissions'
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
   * @param {IUserPermissionJSON | TUserPermissionID} permission The value passed to the constructor.
   * @returns {IUserPermissionJSON | TUserPermissionID} A user permission or an error.
   * @note The permission parameter that is passed to this function
   * varies depending on the context. When a user is being created
   * or updated, the permission parameter is a JSON object (IUserPermissionJSON).
   * However, when a user is being queried, the permission parameter is a
   * string (TUserPermissionID).
   */
  cast(permission: IUserPermissionJSON | TUserPermissionID): any {
    // This is a list of all possible permissions that a user can have.
    let possiblePermissions: TUserPermissionID[] = ['READ', 'WRITE', 'DELETE']

    // If a query is being performed, the permission parameter
    // will be a string. This checks if the permission parameter
    // is a string and converts it to a JSON object if it is.
    if (typeof permission === 'string') {
      permission = {
        id: permission,
      }
    }

    // Checks if the permission parameter is a valid permission.
    if (possiblePermissions.includes(permission.id)) {
      return permission
    } else {
      databaseLogger.error(`Invalid user permission: ${permission.id}`)
      throw new Error(`Invalid user permission: ${permission.id}`)
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
