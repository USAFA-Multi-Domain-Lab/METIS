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
   * @param {TUserPermissionID | TUserPermissionID[]} requiredPermissionIDs The required permission ID(s).
   * @returns {boolean} Whether the user has the given permissions.
   * @note A single permission ID can be passed in as a string, or multiple permission IDs can be passed in as an array of strings.
   * @example // Check if the user has the 'createUser' permission:
   * UserPermission.hasPermissions(userPermissions, 'createUser')
   * @example // Check if the user has the 'createUser' and 'deleteUser' permissions:
   * UserPermission.hasPermissions(userPermissions, ['createUser', 'deleteUser'])
   */
  public static hasPermissions(
    userPermissions: UserPermission[],
    requiredPermissionIDs: TUserPermissionID | TUserPermissionID[],
  ): boolean {
    // This will contain all of the required permissions
    // that the user has.
    let requiredPermissionsInUser: TUserPermissionID[] = []

    // If the required permission IDs is not an array,
    // then make it an array.
    if (!Array.isArray(requiredPermissionIDs)) {
      requiredPermissionIDs = [requiredPermissionIDs]
    }

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
    missions_read: new UserPermission(
      'missions_read',
      'Read Missions',
      'Allows the user in session to retrieve missions from the database.',
    ),
    missions_write: new UserPermission(
      'missions_write',
      'Write Missions',
      'Allows the user in session to create, update, and delete missions in the database.',
    ),
    users_read: new UserPermission(
      'users_read',
      'Read Users',
      'Allows the user in session to retrieve other users from the database.',
    ),
    users_write: new UserPermission(
      'users_write',
      'Write Users',
      'Allows the user in session to create, update, and delete other users in the database.',
    ),
    users_read_students: new UserPermission(
      'users_read_students',
      'Read Student Users',
      'Allows the user in session to retrieve student users only from the database.',
    ),
    users_write_students: new UserPermission(
      'users_write_students',
      'Write Student Users',
      'Allows the user in session to create, update, and delete student users only in the database.',
    ),
    games_read: new UserPermission(
      'games_read',
      'Read Games',
      'Allows the user in session to retrieve games from the database.',
    ),
    games_write: new UserPermission(
      'games_write',
      'Write Games',
      'Allows the user in session to create, update, and delete games in the database.',
    ),
    games_join: new UserPermission(
      'games_join',
      'Join Games',
      'Allows the user in session to join games.',
    ),
    games_join_participant: new UserPermission(
      'games_join_participant',
      'Join Games (Participant)',
      'Allows the user in session to join games as a participant.',
    ),
    games_join_manager: new UserPermission(
      'games_join_manager',
      'Join Games (Manager)',
      'Allows the user in session to join games as a manager.',
    ),
    games_join_observer: new UserPermission(
      'games_join_observer',
      'Join Games (Observer)',
      'Allows the user in session to join games as an observer.',
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

const userPermissionNames = [
  'Read Missions',
  'Write Missions',
  'Read Users',
  'Write Users',
  'Read Student Users',
  'Write Student Users',
  'Read Games',
  'Write Games',
  'Join Games',
  'Join Games (Participant)',
  'Join Games (Manager)',
  'Join Games (Observer)',
] as const
export type TPermissionName = (typeof userPermissionNames)[number]

const userPermissionIDs = [
  'missions_read',
  'missions_write',
  'users_read',
  'users_write',
  'users_read_students',
  'users_write_students',
  'games_read',
  'games_write',
  'games_join',
  'games_join_participant',
  'games_join_manager',
  'games_join_observer',
] as const
export type TUserPermissionID = (typeof userPermissionIDs)[number]
export type TUserPermissions = { [key in TUserPermissionID]: UserPermission }
