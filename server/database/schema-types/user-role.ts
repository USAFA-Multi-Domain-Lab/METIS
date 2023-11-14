import { databaseLogger } from 'metis/server/logging'
import UserRole, { TUserRole } from 'metis/users/roles'
import mongoose from 'mongoose'

/**
 * This is a custom schema type for user roles.
 * @extends {mongoose.SchemaType}
 */
export class Role extends mongoose.SchemaType {
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
   * @param {TUserRole['id']} roleID The value passed to the constructor.
   * @returns {any} A user role ID or an error.
   */
  public cast(roleID: TUserRole['id']): TUserRole['id'] {
    // Checks to make sure the role ID that's passed
    // is valid.
    let isValidRoleID: boolean = UserRole.isValidRoleID(roleID)

    // Checks if the role parameter is a valid role.
    if (isValidRoleID) {
      return roleID
    } else {
      databaseLogger.error(`Invalid user role ID: ${roleID}`)
      throw new Error(`Invalid user role ID: ${roleID}`)
    }
  }
}

// This is responsible for adding
// the custom schema type to the
// mongoose namespace.
declare module 'mongoose' {
  namespace Schema.Types {
    class Role extends mongoose.SchemaType {
      constructor(key: string, options: any)
    }
  }
}

// This is responsible for registering
// the custom schema type.
mongoose.Schema.Types.Role = Role

export default Role
