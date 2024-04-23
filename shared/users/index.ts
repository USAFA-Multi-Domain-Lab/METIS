import { v4 as generateHash } from 'uuid'
import UserPermission, {
  TUserPermission,
  TUserPermissionId,
} from './permissions'
import UserRole, { TUserRole } from './roles'

/**
 * Represents a user using METIS.
 */
export default abstract class User implements TCommonUser {
  // Inherited
  public _id: TCommonUser['_id']

  // Inherited
  public username: TCommonUser['username']

  // Inherited
  public role: TCommonUser['role']

  // Inherited
  public expressPermissions: TCommonUser['expressPermissions']

  // Inherited
  public firstName: TCommonUser['firstName']

  // Inherited
  public lastName: TCommonUser['lastName']

  // Inherited
  public needsPasswordReset: TCommonUser['needsPasswordReset']

  // Inherited
  public password?: TCommonUser['password']

  /**
   * @param data The user data from which to create the user. Any ommitted values will be set to the default properties defined in User.DEFAULT_PROPERTIES.
   * @param options Options for creating the user.
   */
  public constructor(
    data: Partial<TCommonUserJson> = User.DEFAULT_PROPERTIES,
    options: TUserOptions = {},
  ) {
    this._id = data._id?.toString() ?? User.DEFAULT_PROPERTIES._id
    this.username = data.username ?? User.DEFAULT_PROPERTIES.username
    this.role = UserRole.get(data.roleId ?? UserRole.DEFAULT_ID)
    this.firstName = data.firstName ?? User.DEFAULT_PROPERTIES.firstName
    this.lastName = data.lastName ?? User.DEFAULT_PROPERTIES.lastName
    this.needsPasswordReset =
      data.needsPasswordReset ?? User.DEFAULT_PROPERTIES.needsPasswordReset
    this.expressPermissions = UserPermission.get(
      data.expressPermissionIds ?? User.DEFAULT_PROPERTIES.expressPermissionIds,
    )
  }

  /**
   * Converts the User object to JSON.
   * @param {TUserOptions} options Options for converting the user to JSON.
   * @returns {TCommonUserJson} A JSON representation of the user.
   */
  public toJson(options: TUserOptions = {}): TCommonUserJson {
    // Construct JSON object to send to server.
    let json: TCommonUserJson = {
      _id: this._id,
      username: this.username,
      firstName: this.firstName,
      lastName: this.lastName,
      roleId: this.role._id,
      needsPasswordReset: this.needsPasswordReset,
      expressPermissionIds: this.expressPermissions.map(
        (permission: UserPermission) => permission._id,
      ),
      password: this.password,
    }

    return json
  }

  /**
   * Checks to see if a user is authorized to perform an action
   * by comparing the user's permissions to the permissions
   * required to perform the action.
   * @param requiredPermissions The permission(s) required to perform the action.
   * @returns Whether the user is authorized to perform the action.
   * @note A single permission ID can be passed in as a string, or multiple permission IDs can be passed in as an array of strings.
   * @example // Check if the user has the 'createUser' permission:
   * user.isAuthorized('createUser')
   * @example // Check if the user has the 'createUser' and 'deleteUser' permissions:
   * user.isAuthorized(['createUser', 'deleteUser'])
   */
  public isAuthorized = (
    requiredPermissions: TUserPermissionId | TUserPermissionId[],
  ): boolean => {
    // Current user in session.
    let currentUser = this
    // What the current user is allowed
    // to do based on their role.
    let { permissions: rolePermissions } = this.role
    // What the current user is allowed
    // to do based on their specific
    // permissions.
    let { expressPermissions } = currentUser

    // If the current user in the
    // session has the revoked
    // access role, they are not
    // authorized to perform any
    // actions.
    if (currentUser.role._id === 'revokedAccess') {
      return false
    } else {
      // Check if the user has the required
      // permissions based on their role.
      let roleHasRequiredPermissions: boolean = UserPermission.hasPermissions(
        rolePermissions,
        requiredPermissions,
      )
      // Check to see if the user has been
      // given specific permissions that
      // override their role permissions.
      let userHasSpecificPermissions: boolean = UserPermission.hasPermissions(
        expressPermissions,
        requiredPermissions,
      )
      return roleHasRequiredPermissions || userHasSpecificPermissions
    }
  }

  /**
   * Default properties set when creating a new User object.
   */
  public static get DEFAULT_PROPERTIES(): TCommonUserJson {
    return {
      _id: generateHash(),
      username: '',
      firstName: '',
      lastName: '',
      roleId: UserRole.DEFAULT_ID,
      needsPasswordReset: false,
      expressPermissionIds: [],
    }
  }

  /**
   * Validates the username of a user.
   * @param username The username to validate.
   */
  public static isValidUsername = (
    username: TCommonUserJson['username'],
  ): boolean => {
    let userExpression: RegExp = /^([a-zA-Z0-9-_.]{5,25})$/
    let isValidUsername: boolean = userExpression.test(username)

    return isValidUsername
  }
}

/* ------------------------------ USER TYPES ------------------------------ */

/**
 * Options for creating new User objects.
 */
export type TUserOptions = {}

/**
 * Type used for the abstract User class.
 */
export interface TCommonUser {
  /**
   * The user's ID.
   */
  _id: string
  /**
   * The user's username.
   */
  username: string
  /**
   * The user's role.
   */
  role: UserRole
  /**
   * The user's permissions.
   */
  expressPermissions: UserPermission[]
  /**
   * The user's first name.
   */
  firstName: string
  /**
   * The user's last name.
   */
  lastName: string
  /**
   * Whether the user needs to reset their password.
   */
  needsPasswordReset: boolean
  /**
   * The user's password.
   */
  password?: string
  /**
   * Converts the User object to JSON.
   * @returns {TCommonUserJson} A JSON representation of the user.
   */
  toJson: (options?: TUserOptions) => TCommonUserJson
}

/**
 * The JSON representation of a User object.
 */
export interface TCommonUserJson {
  /**
   * The user's ID.
   */
  _id: string
  /**
   * The user's username.
   */
  username: string
  /**
   * The user's role ID.
   */
  roleId: TUserRole['_id']
  /**
   * Specific express permission IDs assigned
   * to the user.
   */
  expressPermissionIds: TUserPermission['_id'][]
  /**
   * The user's first name.
   */
  firstName: string
  /**
   * The user's last name.
   */
  lastName: string
  /**
   * Whether the user needs to reset their password.
   */
  needsPasswordReset: boolean
  /**
   * The user's password.
   */
  password?: string
}
