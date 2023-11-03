import { databaseLogger } from 'metis/server/logging'
import { IUserRoleJSON, TUserRoleID } from 'metis/users/roles'
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
   * @param {IUserRoleJSON | TUserRoleID} role The value passed to the constructor.
   * @returns {any} A user role or an error.
   * @note The role parameter that is passed to this function
   * varies depending on the context. When a user is being created
   * or updated, the role parameter is a JSON object (IUserRoleJSON).
   * However, when a user is being queried, the role parameter is a
   * string (TUserRoleID).
   */
  cast(role: IUserRoleJSON | TUserRoleID): any {
    // This is a list of all possible roles that a user can have.
    let possibleRoles: TUserRoleID[] = ['student', 'instructor', 'admin']

    // If a query is being performed, the role parameter
    // will be a string. This checks if the role parameter
    // is a string and converts it to a JSON object if it is.
    if (typeof role === 'string') {
      role = {
        id: role,
      }
    }

    // Checks if the role parameter is a valid role.
    if (possibleRoles.includes(role.id)) {
      return role
    } else {
      databaseLogger.error(`Invalid user role: ${role}`)
      throw new Error(`Invalid user role: ${role}`)
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
