

/* -- CONSTANTS -- */

export const AVAILABLE_PERMISSIONS_RAW = [
  {
    _id: 'missions_read',
    name: 'Read Missions',
    description:
      'Allows the user currently logged in to retrieve missions from the database.',
  } as const,
  {
    _id: 'missions_write',
    name: 'Write Missions',
    description:
      'Allows the user currently logged in to create, update, and delete missions in the database.',
  } as const,
  {
    _id: 'environments_read',
    name: 'Read Target Environments',
    description:
      'Allows the user currently logged in to retrieve target environments from the registry.',
  } as const,
  {
    _id: 'users_read',
    name: 'Read Users',
    description:
      'Allows the user currently logged in to retrieve other users from the database.',
  } as const,
  {
    _id: 'users_write',
    name: 'Write Users',
    description:
      'Allows the user currently logged in to create, update, and delete other users in the database.',
  } as const,
  {
    _id: 'users_read_students',
    name: 'Read Student Users',
    description:
      'Allows the user currently logged in to retrieve student users only from the database.',
  } as const,
  {
    _id: 'users_write_students',
    name: 'Write Student Users',
    description:
      'Allows the user currently logged in to create, update, and delete student users only in the database.',
  } as const,
  {
    _id: 'files_read',
    name: 'Read Files',
    description:
      'Allows the user currently logged in to retrieve files from the file store.',
  } as const,
  {
    _id: 'files_write',
    name: 'Write Files',
    description:
      'Allows the user currently logged in to create, update, and delete files in the file store.',
  } as const,
  {
    _id: 'sessions_read',
    name: 'Read Sessions',
    description:
      'Allows the user currently logged in to retrieve sessions from the database.',
  } as const,
  {
    _id: 'sessions_write',
    name: 'Write Sessions',
    description:
      'Allows the user currently logged in to create, update, and delete all sessions in the database.',
  } as const,
  {
    _id: 'sessions_write_native',
    name: 'Write Sessions (Native)',
    description:
      'Allows the user currently logged in to create, update, and delete sessions that they own.',
  } as const,
  {
    _id: 'sessions_write_foreign',
    name: 'Write Sessions (Foreign)',
    description:
      'Allows the user currently logged in to create, update, and delete sessions that they do not own.',
  } as const,
  {
    _id: 'sessions_join_participant',
    name: 'Join Sessions (Participant)',
    description:
      'Allows the user currently logged in to join sessions as a participant.',
  } as const,
  {
    _id: 'sessions_join_manager',
    name: 'Join Sessions (Manager)',
    description:
      'Allows the user currently logged in to join sessions as a manager.',
  } as const,
  {
    _id: 'sessions_join_manager_native',
    name: 'Join Sessions (Manager of Native Sessions)',
    description:
      'Allows the user currently logged in to join sessions as a manager that they own.',
  } as const,
  {
    _id: 'sessions_join_observer',
    name: 'Join Sessions (Observer)',
    description:
      'Allows the user currently logged in to join sessions as an observer.',
  } as const,
  {
    _id: 'changelog_read',
    name: 'Read Changelog',
    description:
      'Allows the user currently logged in to retrieve the changelog.',
  } as const,
] as const

/* -- CLASS -- */

/**
 * Represents any permission that can be assigned to a user.
 */
export class UserPermission implements TUserPermission {
  public readonly _id: TUserPermission['_id']
  public readonly name: TUserPermission['name']
  public readonly description: TUserPermission['description']

  public constructor(
    _id: TUserPermission['_id'],
    name: TUserPermission['name'],
    description: TUserPermission['description'],
  ) {
    this._id = _id
    this.name = name
    this.description = description
  }

  /**
   * Gets the user permission objects from the given permission IDs.
   * @param permissionIds The permission IDs used to get the user permission objects.
   * @returns An array of user permission objects.
   */
  public static get(permissionIds: TUserPermission['_id'][]): UserPermission[] {
    return permissionIds.map(
      (permissionId: TUserPermission['_id']) =>
        UserPermission.AVAILABLE_PERMISSIONS[permissionId],
    )
  }

  /**
   * Checks whether the user has the given permissions.
   * @param userPermissions The user's permissions.
   * @param requiredPermissionIds The required permission ID(s).
   * @returns Whether the user has the given permissions.
   * @note A single permission ID can be passed in as a string, or multiple permission IDs can be passed in as an array of strings.
   * @example // Check if the user has the 'createUser' permission:
   * UserPermission.hasPermissions(userPermissions, 'createUser')
   * @example // Check if the user has the 'createUser' and 'deleteUser' permissions:
   * UserPermission.hasPermissions(userPermissions, ['createUser', 'deleteUser'])
   */
  public static hasPermissions(
    userPermissions: UserPermission[],
    requiredPermissionIds: TUserPermissionId | TUserPermissionId[],
  ): boolean {
    // This will contain all of the required permissions
    // that the user has.
    let requiredPermissionsInUser: TUserPermissionId[] = []
    let hasPermissions: true[] = []

    // If the required permission IDs is not an array,
    // then make it an array.
    if (!Array.isArray(requiredPermissionIds)) {
      requiredPermissionIds = [requiredPermissionIds]
    }

    // Loop through the user's permissions to check if
    // the user has all of the required permissions.
    userPermissions.forEach((userPermission: UserPermission) => {
      // If the user has the required permission, then
      // add it to the allRequiredPermissionsInUser array.
      if (requiredPermissionIds.includes(userPermission._id)) {
        requiredPermissionsInUser.push(userPermission._id)
      }
    })

    // If the required permissions that the user has
    // is not equal to the required permissions passed,
    // then check if the user has any permissions that
    // are higher up in the permission hierarchy.
    if (requiredPermissionsInUser.length !== requiredPermissionIds.length) {
      // Loop through the required permission IDs to check
      // if the user has any permissions that are higher up
      // in the permission hierarchy.
      requiredPermissionIds.forEach(
        (requiredPermissionId: TUserPermissionId) => {
          // Split the required permission ID into layers.
          let idLayers = requiredPermissionId.split('_')
          // This will be used to check each layer of the
          // required permission ID.
          let idCursor: any = ''

          // Loop through the layers of the required permission
          // ID to check if the user has any permissions that
          // are higher up in the permission hierarchy.
          while (idLayers.length > 0) {
            // Add the next layer to the idCursor.
            idCursor += idLayers.shift()

            // Check if the user has the permission with the
            // current idCursor.
            let permissionId: UserPermission | undefined = userPermissions.find(
              (userPermission: UserPermission) =>
                userPermission._id === idCursor,
            )
            let userHasPermission: boolean =
              permissionId !== undefined ? true : false

            // If the cursor is a valid permission ID and the user
            // has the valid permission, then add true to the
            // hasPermissions array and break the loop.
            if (
              UserPermission.isValidPermissionId(idCursor) &&
              userHasPermission
            ) {
              hasPermissions.push(true)
              break
            }

            // If the cursor is not a valid permission ID, then
            // add an underscore to the cursor and continue
            // the loop.
            idCursor += '_'
          }
        },
      )
    }

    // If the required permissions that the user has
    // is equal to the required permissions passed,
    // or if the user has any permissions that are higher
    // up in the permission hierarchy, then the user has
    // all of the required permissions and true is returned.
    return (
      requiredPermissionsInUser.length === requiredPermissionIds.length ||
      hasPermissions.length === requiredPermissionIds.length
    )
  }

  /**
   * Checks whether the given permission ID is valid.
   * @param permissionId The permission ID to check.
   */
  public static isValidPermissionId(permissionId: TUserPermissionId): boolean {
    return UserPermission.AVAILABLE_PERMISSION_IDS.includes(permissionId)
  }

  /**
   * All available user permissions in METIS.
   */
  public static readonly AVAILABLE_PERMISSIONS: TUserPermissions = (() => {
    let permissions: TUserPermissions = {} as TUserPermissions
    AVAILABLE_PERMISSIONS_RAW.forEach(
      ({ _id, name, description }) =>
        (permissions[_id] = new UserPermission(_id, name, description)),
    )
    return permissions
  })()

  /**
   * All available user permission IDs in METIS.
   */
  public static readonly AVAILABLE_PERMISSION_IDS =
    AVAILABLE_PERMISSIONS_RAW.map(({ _id }) => _id)
}


/* -- TYPES -- */


/**
 * Type for a valid name for a user permission.
 */
type TUserPermissionName = (typeof AVAILABLE_PERMISSIONS_RAW)[number]['name']

/**
 * Type for a valid description for a user permission.
 */
type TUserPermissionDescription =
  (typeof AVAILABLE_PERMISSIONS_RAW)[number]['description']

/**
 * Type for all valid user permissions available.
 */
export type TUserPermissions = { [key in TUserPermissionId]: UserPermission }

/**
/**
 * Represents a user permission.
 */
export type TUserPermission = {
  /**
   * The user permission's ID.
   */
  _id: TUserPermissionId
  /**
   * The user permission's name.
   */
  name: TUserPermissionName
  /**
   * The user permission's description.
   */
  description: TUserPermissionDescription
}

/**
 * Type for a valid ID for a user permission.
 */
export type TUserPermissionId =
  (typeof AVAILABLE_PERMISSIONS_RAW)[number]['_id']
