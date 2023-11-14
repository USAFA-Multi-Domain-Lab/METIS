/**
 * Represents any permission that can be assigned to a user.
 */
export default class UserPermission implements TUserPermission {
  public readonly id: TUserPermission['id']
  public readonly name: TUserPermission['name']
  public readonly description: TUserPermission['description']

  public constructor(
    id: TUserPermission['id'],
    name: TUserPermission['name'],
    description: TUserPermission['description'],
  ) {
    this.id = id
    this.name = name
    this.description = description
  }

  /**
   * Gets the user permission objects from the given permission IDs.
   * @param {TUserPermission['id'][]} permissionIDs The permission IDs used to get the user permission objects.
   * @returns {UserPermission} A user permission object.
   */
  public static get(permissionIDs: TUserPermission['id'][]): UserPermission[] {
    return permissionIDs.map(
      (permissionID: TUserPermission['id']) =>
        UserPermission.AVAILABLE_PERMISSIONS[permissionID],
    )
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

/* ------------------------------ USER PERMISSION TYPES ------------------------------ */

/**
 * Type used for the abstract UserPermission class.
 */
export type TUserPermission = {
  /**
   * The user permission's ID.
   */
  id: TUserPermissionID
  /**
   * The user permission's name.
   */
  name: TPermissionName
  /**
   * The user permission's description.
   */
  description: string
}

const userPermissionNames = ['Read', 'Write', 'Delete'] as const
export type TPermissionName = (typeof userPermissionNames)[number]

const userPermissionIDs = ['READ', 'WRITE', 'DELETE'] as const
export type TUserPermissionID = (typeof userPermissionIDs)[number]
export type TUserPermissions = { [key in TUserPermissionID]: UserPermission }
