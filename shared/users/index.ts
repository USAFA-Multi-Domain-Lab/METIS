import { TMetisSession } from 'metis/sessions'
import UserPermission, {
  TUserPermission,
  TUserPermissionID,
} from './permissions'
import UserRole, { TUserRole } from './roles'

/**
 * Represents a user using METIS.
 */
export default abstract class User implements TUser {
  public userID: TUser['userID']
  public role: TUser['role']
  public expressPermissions: TUser['expressPermissions']
  public firstName: TUser['firstName']
  public lastName: TUser['lastName']
  public needsPasswordReset: TUser['needsPasswordReset']
  public password?: TUser['password']
  /**
   * @deprecated ***This is no longer supported and will be removed in the future.***
   * @returns {boolean} Whether the user has restricted access.
   */
  public hasRestrictedAccess: TUser['hasRestrictedAccess']
  /**
   * @deprecated ***This is no longer supported and will be removed in the future.***
   * @returns {boolean} Whether the user has full access.
   */
  public hasFullAccess: TUser['hasFullAccess']

  /**
   * @param {TUserJSON} data The user data from which to create the user. Any ommitted values will be set to the default properties defined in User.DEFAULT_PROPERTIES.
   * @param {TUserOptions} options Options for creating the user.
   */
  public constructor(
    data: Partial<TUserJSON> = User.DEFAULT_PROPERTIES,
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
   * @returns {TUserJSON} A JSON representation of the user.
   */
  public toJSON(options: TUserOptions = {}): TUserJSON {
    // Construct JSON object to send to server.
    let JSON: TUserJSON = {
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

    return JSON
  }

  public static isAuthorized = (
    session: TMetisSession<TUser> | undefined,
    requiredPermissions: TUserPermissionID[],
  ): boolean => {
    // Current METIS session.
    if (session) {
      // Current user in session.
      let { user: currentUser } = session
      // What the current user is allowed
      // to do based on their role.
      let { permissions: rolePermissions } = currentUser.role
      // What the current user is allowed
      // to do based on their specific
      // permissions.
      let { expressPermissions } = currentUser
      // Check if the user has the required
      // permissions.
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

      // If the current user in the
      // session has the revoked
      // access role, they are not
      // authorized to perform any
      // actions.
      if (currentUser.role.id === 'revokedAccess') {
        return false
      }
      // If the current user in session has a role
      // with the required permission(s), or if the
      // user has been given specific permissions
      // that override their role permissions, then
      // they are authorized to perform the action.
      else if (roleHasRequiredPermissions || userHasSpecificPermissions) {
        return true
      }
      // If neither of the above are true, then the
      // current user in session should not be
      // authorized to perform the action.
      else {
        return false
      }
    }
    // If there is no session, the user is not
    // authorized to perform the action.
    else {
      return false
    }
  }

  /**
   * Default properties set when creating a new user.
   */
  public static get DEFAULT_PROPERTIES(): TUserJSON {
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
 * Type used for the abstract User class.
 */
export type TUser = Omit<TUserJSON, 'roleID' | 'expressPermissionIDs'> & {
  /**
   * The user's role.
   */
  role: UserRole
  /**
   * The user's permissions.
   */
  expressPermissions: UserPermission[]
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
  /**
   * Converts the User object to JSON.
   * @returns {TUserJSON} A JSON representation of the user.
   */
  toJSON(options?: TUserOptions): TUserJSON
}

/**
 * The JSON representation of a User object.
 */
export type TUserJSON = {
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

/**
 * Options for creating new User objects.
 */
export type TUserOptions = {}

// todo: remove
// ! export interface IUserJSONExposed {
// !  firstName: string
// !  lastName: string
// !  userID: string
// !   password: string
// ! }
