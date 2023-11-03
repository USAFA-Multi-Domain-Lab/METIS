import UserPermission, { IUserPermissionJSON } from './permissions'
import UserRole, { IUserRoleJSON } from './roles'

/**
 * Interface used for the abstract User class.
 */
export interface IUser extends IUserJSON {
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
   * @returns {IUserJSON} A JSON representation of the user.
   */
  toJSON(options?: TUserJSONOptions): IUserJSON
}

/**
 * The JSON representation of a User object.
 */
export interface IUserJSON {
  /**
   * The user's ID.
   */
  userID: string
  /**
   * JSON representation of the user's role.
   */
  role: IUserRoleJSON
  /**
   * Specific express permissions assigned
   * to the user.
   */
  expressPermissions: IUserPermissionJSON[]
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
export interface IUserOptions {}

/**
 * Options for creating new User objects.
 */
export type TUserJSONOptions = {
  password?: IUserJSON['password']
}

// todo: remove
// ! export interface IUserJSONExposed {
// !  firstName: string
// !  lastName: string
// !  userID: string
// !   password: string
// ! }

/**
 * Represents a user using METIS.
 */
export default abstract class User implements IUser {
  public userID: IUser['userID']
  public role: IUser['role']
  public expressPermissions: IUser['expressPermissions']
  public firstName: IUser['firstName']
  public lastName: IUser['lastName']
  public needsPasswordReset: IUser['needsPasswordReset']
  /**
   * @deprecated ***This is no longer supported and will be removed in the future.***
   * @returns {boolean} Whether the user has restricted access.
   */
  public hasRestrictedAccess: IUser['hasRestrictedAccess']
  /**
   * @deprecated ***This is no longer supported and will be removed in the future.***
   * @returns {boolean} Whether the user has full access.
   */
  public hasFullAccess: IUser['hasFullAccess']

  /**
   * @param {IUserJSON} data The user data from which to create the user. Any ommitted values will be set to the default properties defined in User.DEFAULT_PROPERTIES.
   * @param {IUserOptions} options Options for creating the user.
   */
  public constructor(
    data: Partial<IUserJSON> = User.DEFAULT_PROPERTIES,
    options: IUserOptions = {},
  ) {
    this.userID = data.userID ?? User.DEFAULT_PROPERTIES.userID
    this.role = this.parseUserRoleData(data.role ?? UserRole.DEFAULT_PROPERTIES)
    this.firstName = data.firstName ?? User.DEFAULT_PROPERTIES.firstName
    this.lastName = data.lastName ?? User.DEFAULT_PROPERTIES.lastName
    this.needsPasswordReset =
      data.needsPasswordReset ?? User.DEFAULT_PROPERTIES.needsPasswordReset
    this.expressPermissions = this.parseUserPermissionData(
      data.expressPermissions ?? User.DEFAULT_PROPERTIES.expressPermissions,
    )

    this.hasRestrictedAccess = UserRole.RESTRICTED_ACCESS_ROLES.includes(
      this.role.name,
    )
    this.hasFullAccess = UserRole.FULL_ACCESS_ROLES.includes(this.role.name)
  }

  /**
   * Parses the user role data into UserRole objects.
   * @param {IUserRoleJSON} data The user role data to parse.
   * @returns {UserRole} The parsed user role data.
   */
  protected abstract parseUserRoleData(data: IUserRoleJSON): UserRole

  /**
   * Parses the user permission data into UserPermission objects.
   * @param {IUserPermissionJSON[]} data The user permission data to parse.
   * @returns {UserPermission} The parsed user permission data.
   */
  protected abstract parseUserPermissionData(
    data: IUserPermissionJSON[],
  ): UserPermission[]

  /**
   * Converts the User object to JSON.
   * @returns {IUserJSON} A JSON representation of the user.
   */
  public toJSON(options: TUserJSONOptions = {}): IUserJSON {
    // Construct JSON object to send to server.
    let JSON: IUserJSON = {
      userID: this.userID,
      firstName: this.firstName,
      lastName: this.lastName,
      role: this.role.toJSON(),
      needsPasswordReset: this.needsPasswordReset,
      expressPermissions: this.expressPermissions.map(
        (permission: UserPermission) => permission.toJSON(),
      ),
    }

    if (options.password !== undefined) {
      JSON.password = options.password
    }

    return JSON
  }

  /**
   * Default properties set when creating a new user.
   */
  public static get DEFAULT_PROPERTIES(): IUserJSON {
    return {
      userID: '',
      firstName: '',
      lastName: '',
      role: UserRole.DEFAULT_PROPERTIES,
      needsPasswordReset: false,
      expressPermissions: [],
    }
  }
}
