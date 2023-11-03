/**
 * Interface used for the abstract UserPermission class.
 */
export interface IUserPermission extends IUserPermissionJSON {
  /**
   * The user permission's name.
   */
  name: TPermissionName
  /**
   * The user permission's description.
   */
  description: string
  /**
   * Converts the UserPermission object to JSON.
   */
  toJSON(): IUserPermissionJSON
}

/**
 * The JSON representation of a UserPermission object.
 */
export interface IUserPermissionJSON {
  /**
   * The user permission's ID.
   */
  id: TUserPermissionID
}

const userPermissionNames = ['Read', 'Write', 'Delete'] as const
export type TPermissionName = (typeof userPermissionNames)[number]

const userPermissionIDs = ['READ', 'WRITE', 'DELETE'] as const
export type TUserPermissionID = (typeof userPermissionIDs)[number]
export type TUserPermissions = { [key in TUserPermissionID]: UserPermission }

/**
 * Represents any permission that can be assigned to a user.
 */
export default class UserPermission implements IUserPermission {
  public readonly id: IUserPermission['id']
  public readonly name: IUserPermission['name']
  public readonly description: IUserPermission['description']

  public constructor(
    id: IUserPermission['id'],
    name: IUserPermission['name'],
    description: IUserPermission['description'],
  ) {
    this.id = id
    this.name = name
    this.description = description
  }

  /**
   * Checks whether the user has the given permissions.
   * @param {UserPermission[]} userPermissions The user's permissions.
   * @param {TUserPermissionID[]} requiredPermissionIDs The required permission IDs.
   * @returns {boolean} Whether the user has the given permissions.
   */
  public static hasPermissions(
    userPermissions: UserPermission[],
    requiredPermissionIDs: TUserPermissionID[],
  ): boolean {
    // This will contain all of the required permissions
    // that the user has.
    let requiredPermissionsInUser: TUserPermissionID[] = []

    // Loop through the user's permissions to check if
    // the user has all of the required permissions.
    userPermissions.forEach((userPermission: UserPermission) => {
      // If the user has the required permission, then
      // add it to the allRequiredPermissionsInUser array.
      if (requiredPermissionIDs.includes(userPermission.id)) {
        requiredPermissionsInUser.push(userPermission.id)
      }
    })

    // If the required permissions that the user has
    // is equal to the required permissions passed,
    // then the user has all of the required permissions
    // and true is returned.
    return requiredPermissionsInUser.length === requiredPermissionIDs.length
  }

  /**
   * Checks whether the given permission ID is valid.
   * @param {TUserPermissionID} permissionID The permission ID to check.
   */
  public static isValidPermissionID(permissionID: TUserPermissionID): boolean {
    return userPermissionIDs.includes(permissionID)
  }

  /**
   * Converts the UserPermission object to JSON.
   * @returns {IUserPermissionJSON} The JSON representation of the UserPermission object.
   */
  public toJSON(): IUserPermissionJSON {
    return {
      id: this.id,
    }
  }

  /**
   * Default properties for a UserPermission object.
   */
  public static DEFAULT_PROPERTIES: IUserPermissionJSON = {
    id: 'READ',
  }

  /**
   * All available user permissions in METIS.
   */
  public static readonly AVAILABLE_PERMISSIONS: TUserPermissions = {
    READ: new UserPermission('READ', 'Read', 'Allows the user to read data.'),
    WRITE: new UserPermission(
      'WRITE',
      'Write',
      'Allows the user to write data.',
    ),
    DELETE: new UserPermission(
      'DELETE',
      'Delete',
      'Allows the user to delete data.',
    ),
  }
}
