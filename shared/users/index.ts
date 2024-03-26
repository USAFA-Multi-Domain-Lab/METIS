import UserPermission, {
  TUserPermission,
  TUserPermissionID,
} from './permissions'
import UserRole, { TUserRole } from './roles'

/**
 * Represents a user using METIS.
 */
export default abstract class User implements TCommonUser {
  // Inherited
  public userID: TCommonUser['userID']

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
   * @deprecated ***This is no longer supported and will be removed in the future.***
   * @returns {boolean} Whether the user has restricted access.
   */
  public hasRestrictedAccess: TCommonUser['hasRestrictedAccess']

  /**
   * @deprecated ***This is no longer supported and will be removed in the future.***
   * @returns {boolean} Whether the user has full access.
   */
  public hasFullAccess: TCommonUser['hasFullAccess']

  /**
   * @param {TCommonUserJson} data The user data from which to create the user. Any ommitted values will be set to the default properties defined in User.DEFAULT_PROPERTIES.
   * @param {TUserOptions} options Options for creating the user.
   */
  public constructor(
    data: Partial<TCommonUserJson> = User.DEFAULT_PROPERTIES,
    options: TUserOptions = {},
  ) {
    this.userID = data.userID ?? User.DEFAULT_PROPERTIES.userID
    this.role = UserRole.get(data.roleID ?? UserRole.DEFAULT_ID)
    this.firstName = data.firstName ?? User.DEFAULT_PROPERTIES.firstName
    this.lastName = data.lastName ?? User.DEFAULT_PROPERTIES.lastName
    this.needsPasswordReset =
      data.needsPasswordReset ?? User.DEFAULT_PROPERTIES.needsPasswordReset
    this.expressPermissions = UserPermission.get(
      data.expressPermissionIDs ?? User.DEFAULT_PROPERTIES.expressPermissionIDs,
    )

    this.hasRestrictedAccess = UserRole.RESTRICTED_ACCESS_ROLES.includes(
      this.role.name,
    )
    this.hasFullAccess = UserRole.FULL_ACCESS_ROLES.includes(this.role.name)
  }

  /**
   * Converts the User object to JSON.
   * @param {TUserOptions} options Options for converting the user to JSON.
   * @returns {TCommonUserJson} A JSON representation of the user.
   */
  public toJson(options: TUserOptions = {}): TCommonUserJson {
    // Construct JSON object to send to server.
    let json: TCommonUserJson = {
      userID: this.userID,
      firstName: this.firstName,
      lastName: this.lastName,
      roleID: this.role.id,
      needsPasswordReset: this.needsPasswordReset,
      expressPermissionIDs: this.expressPermissions.map(
        (permission: UserPermission) => permission.id,
      ),
      password: this.password,
    }

    return json
  }

  /**
   * Checks to see if a user is authorized to perform an action
   * by comparing the user's permissions to the permissions
   * required to perform the action.
   * @param {TUserPermissionID | TUserPermissionID[]} requiredPermissions The permission(s) required to perform the action.
   * @returns {boolean} Whether the user is authorized to perform the action.
   * @note A single permission ID can be passed in as a string, or multiple permission IDs can be passed in as an array of strings.
   * @example // Check if the user has the 'createUser' permission:
   * user.isAuthorized('createUser')
   * @example // Check if the user has the 'createUser' and 'deleteUser' permissions:
   * user.isAuthorized(['createUser', 'deleteUser'])
   */
  public isAuthorized = (
    requiredPermissions: TUserPermissionID | TUserPermissionID[],
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
    if (currentUser.role.id === 'revokedAccess') {
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
      userID: '',
      firstName: '',
      lastName: '',
      roleID: UserRole.DEFAULT_ID,
      needsPasswordReset: false,
      expressPermissionIDs: [],
    }
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
  userID: string
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
  /**
   * Whether the user has restricted access.
   * @deprecated
   */
  hasRestrictedAccess: boolean
  /**
   * Whether the user has full access.
   * @deprecated
   */
  hasFullAccess: boolean
}

/**
 * The JSON representation of a User object.
 */
export interface TCommonUserJson {
  /**
   * The user's ID.
   */
  userID: string
  /**
   * The user's role ID.
   */
  roleID: TUserRole['id']
  /**
   * Specific express permission IDs assigned
   * to the user.
   */
  expressPermissionIDs: TUserPermission['id'][]
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
