import { TBaseMissionComponents } from 'metis/missions'
import { v4 as generateHash } from 'uuid'
import { MetisComponent, TMetisBaseComponents } from '..'
import UserAccess, { TUserAccess } from './accesses'
import UserPermission, {
  TUserPermission,
  TUserPermissionId,
} from './permissions'

/**
 * Represents a user using METIS.
 */
export default abstract class User<
  T extends TBaseMissionComponents = TBaseMissionComponents,
> extends MetisComponent {
  /**
   * The user's username.
   */
  public username: string

  /**
   * The user's access.
   */
  public access: UserAccess

  /**
   * The user's permissions.
   */
  public expressPermissions: UserPermission[]

  /**
   * The user's first name.
   */
  public firstName: string

  /**
   * The user's last name.
   */
  public lastName: string

  // Overridden
  /**
   * The user's full name.
   */
  public get name(): string {
    return `${this.lastName}, ${this.firstName}`
  }
  // Overridden
  public set name(value: string) {
    throw new Error(
      'Cannot set name of User directly. Use firstName and lastName instead.',
    )
  }

  /**
   * Whether the user needs to reset their password.
   */
  public needsPasswordReset: boolean

  /**
   * The user's password.
   */
  public password: string | undefined

  /**
   * @param data The user data from which to create the user. Any ommitted values will be set to the default properties defined in User.DEFAULT_PROPERTIES.
   * @param options Options for creating the user.
   */
  public constructor(
    data: Partial<TUserJson> = User.DEFAULT_PROPERTIES,
    options: TUserOptions = {},
  ) {
    super(data._id ?? User.DEFAULT_PROPERTIES._id, '', false)

    this.username = data.username ?? User.DEFAULT_PROPERTIES.username
    this.access = UserAccess.get(data.accessId ?? UserAccess.DEFAULT_ID)
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
   * @param options Options for converting the user to JSON.
   * @returns A JSON representation of the user.
   */
  public toJson(options: TUserJsonOptions = {}): TUserJson {
    let { includeId = false } = options

    // Construct JSON object to send to server.
    let json: TUserJson = {
      username: this.username,
      firstName: this.firstName,
      lastName: this.lastName,
      accessId: this.access._id,
      needsPasswordReset: this.needsPasswordReset,
      expressPermissionIds: this.expressPermissions.map(
        (permission) => permission._id,
      ),
      password: this.password,
    }

    // Include the ID in the JSON if specified.
    if (includeId) json._id = this._id

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
    // The user currently logged in.
    let currentUser = this
    // What the current user is allowed
    // to do based on their access.
    let { permissions: accessPermissions } = this.access
    // What the current user is allowed
    // to do based on their specific
    // permissions.
    let { expressPermissions } = currentUser

    // If the user currently logged in
    // has the revoked access, they are
    // not authorized to perform any
    // actions.
    if (currentUser.access._id === 'revokedAccess') {
      return false
    } else {
      // Check if the user has the required
      // permissions based on their access.
      let accessHasRequiredPermissions: boolean = UserPermission.hasPermissions(
        accessPermissions,
        requiredPermissions,
      )
      // Check to see if the user has been
      // given specific permissions that
      // override their access permissions.
      let userHasSpecificPermissions: boolean = UserPermission.hasPermissions(
        expressPermissions,
        requiredPermissions,
      )
      return accessHasRequiredPermissions || userHasSpecificPermissions
    }
  }

  /**
   * Calls the given callback if the user is authorized to perform the action.
   * @param requiredPermissions The permission(s) required to perform the action.
   * @param callback The callback to call if the user is authorized.
   * @returns The result of the callback, `true` if the user was authorized and the
   * callback was called, `false` if the user was not authorized and the callback
   * was not called.
   */
  public authorize = (
    requiredPermissions: TUserPermissionId | TUserPermissionId[],
    callback: () => any,
  ): boolean => {
    if (this.isAuthorized(requiredPermissions)) {
      callback()
      return false
    } else {
      return false
    }
  }

  /**
   * Default properties set when creating a new User object.
   */
  public static get DEFAULT_PROPERTIES(): Required<
    Omit<TUserJson, 'password'>
  > {
    return {
      _id: generateHash(),
      username: '',
      firstName: '',
      lastName: '',
      accessId: UserAccess.DEFAULT_ID,
      needsPasswordReset: false,
      expressPermissionIds: [],
    }
  }

  /**
   * Validates the username of a user.
   * @param username The username to validate.
   * @returns Whether the username is valid.
   */
  public static isValidUsername = (
    username: TUserJson['username'],
  ): boolean => {
    let userExpression: RegExp = /^([a-zA-Z0-9-_.]{5,25})$/
    let isValidUsername: boolean = userExpression.test(username)

    return isValidUsername
  }

  /**
   * Validates the user's password.
   * @param password The password to validate.
   * @returns Whether the password is valid.
   */
  public static isValidPassword = (
    password: NonNullable<TUserJson['password']>,
  ): boolean => {
    let passwordExpression: RegExp = /^([^\s]{8,50})$/
    let isValidPassword: boolean = passwordExpression.test(password)

    return isValidPassword
  }

  /**
   * Validates the name of a user.
   * @param name The name to validate.
   * @returns Whether the name is valid.
   */
  public static isValidName = (
    name: TUserJson['firstName'] | TUserJson['lastName'],
  ): boolean => {
    let nameExpression: RegExp = /^([a-zA-Z']{1,50})$/
    let isValidName: boolean = nameExpression.test(name)

    return isValidName
  }

  /**
   * Gets the full name for the given first
   * and last names.
   * @param firstName The first name.
   * @param lastName The last name.
   * @returns The full name.
   */
  public static getFullName = (
    firstName: TUserJson['firstName'],
    lastName: TUserJson['lastName'],
  ): string => {
    return `${lastName}, ${firstName}`
  }
}

/* ------------------------------ USER TYPES ------------------------------ */

/**
 * Extracts the user type from a registry of METIS
 * components type that extends `TMetisBaseComponents`.
 * @param T The type registry.
 * @returns The user type.
 */
export type TUser<T extends TMetisBaseComponents> = T['user']

/**
 * Options for creating new User objects.
 */
export type TUserOptions = {}

/**
 * Options for converting a User object to JSON.
 */
export type TUserJsonOptions = {
  /**
   * Whether or not to include the ID in the JSON.
   * @default false
   */
  includeId?: boolean
}

/**
 * The JSON representation of a User object.
 */
export interface TUserJson {
  /**
   * The user's ID.
   */
  _id?: string
  /**
   * The user's username.
   */
  username: string
  /**
   * The user's access ID.
   */
  accessId: TUserAccess['_id']
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
