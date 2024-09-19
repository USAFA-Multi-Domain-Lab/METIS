/* -- CONSTANTS -- */

const AVAILABLE_PERMISSIONS_RAW = [
  {
    _id: 'forceAssignable',
    name: 'Force Assignable',
    description:
      "The member can be assigned to forces by a member with 'manageSessionMembers' permission.",
  } as const,
  {
    _id: 'manipulateNodes',
    name: 'Manipulate Nodes',
    description:
      'The member can open nodes and execution actions on nodes within forces to which they have access.',
  } as const,
  {
    _id: 'configureSessions',
    name: 'Configure Sessions',
    description: 'The member can update the session configuration.',
  } as const,
  {
    _id: 'manageSessionMembers',
    name: 'Manage Session Members',
    description:
      'The member can assign participants to forces, as well as kick and ban them from the session, if needed.',
  } as const,
  {
    _id: 'startEndSessions',
    name: 'Start/End Sessions',
    description: 'The member can start and end the session.',
  } as const,
  {
    _id: 'completeVisibility',
    name: 'Complete Visibility',
    description: 'The member can view all forces and all nodes in the mission.',
  } as const,
  {
    _id: 'cheats',
    name: 'Cheats',
    description:
      'The member can execute actions on nodes with the option of bypassing resource cost, process time, failure chance, etc.',
  },
] as const

/* -- CLASSES -- */

/**
 * Represents any permission that can be assigned to a user.
 */
export default class MemberPermission implements TGenericMemberPermission {
  // Implemented
  public readonly _id: TGenericMemberPermission['_id']

  // Implemented
  public readonly name: TGenericMemberPermission['name']

  // Implemented
  public readonly description: TGenericMemberPermission['description']

  public constructor(
    _id: TGenericMemberPermission['_id'],
    name: TGenericMemberPermission['name'],
    description: TGenericMemberPermission['description'],
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
  public static get(permissionIds: TMemberPermissionId[]): MemberPermission[] {
    return permissionIds.map(
      (permissionId: TGenericMemberPermission['_id']) =>
        MemberPermission.AVAILABLE_PERMISSIONS[permissionId],
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
    userPermissions: MemberPermission[],
    requiredPermissionIds: TMemberPermissionId | TMemberPermissionId[],
  ): boolean {
    // This will contain all of the required permissions
    // that the user has.
    let requiredPermissionsInUser: TMemberPermissionId[] = []
    let hasPermissions: true[] = []

    // If the required permission IDs is not an array,
    // then make it an array.
    if (!Array.isArray(requiredPermissionIds)) {
      requiredPermissionIds = [requiredPermissionIds]
    }

    // Loop through the user's permissions to check if
    // the user has all of the required permissions.
    userPermissions.forEach((userPermission: MemberPermission) => {
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
        (requiredPermissionId: TMemberPermissionId) => {
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
            let permissionId: MemberPermission | undefined =
              userPermissions.find(
                (userPermission: MemberPermission) =>
                  userPermission._id === idCursor,
              )
            let userHasPermission: boolean =
              permissionId !== undefined ? true : false

            // If the cursor is a valid permission ID and the user
            // has the valid permission, then add true to the
            // hasPermissions array and break the loop.
            if (
              MemberPermission.isValidPermissionId(idCursor) &&
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
  public static isValidPermissionId(
    permissionId: TMemberPermissionId,
  ): boolean {
    return MemberPermission.AVAILABLE_PERMISSION_IDS.includes(permissionId)
  }

  /**
   * All available member permissions in METIS.
   */
  public static readonly AVAILABLE_PERMISSIONS: TMemberPermissions = (() => {
    let permissions: TMemberPermissions = {} as TMemberPermissions
    AVAILABLE_PERMISSIONS_RAW.forEach(
      ({ _id, name, description }) =>
        (permissions[_id] = new MemberPermission(_id, name, description)),
    )
    return permissions
  })()

  /**
   * All available member permission IDs in METIS.
   */
  public static readonly AVAILABLE_PERMISSION_IDS =
    AVAILABLE_PERMISSIONS_RAW.map(({ _id }) => _id)
}

/* -- TYPES -- */

/**
 * Generice type for a member permission.
 */
export type TGenericMemberPermission = {
  /**
   * The member permission's ID.
   */
  _id: TMemberPermissionId
  /**
   * The member permission's name.
   */
  name: TMemberPermissionName
  /**
   * The member permission's description.
   */
  description: TMemberPermissionDescription
}

/**
 * Type for a valid ID for a member permission.
 */
export type TMemberPermissionId =
  (typeof AVAILABLE_PERMISSIONS_RAW)[number]['_id']

/**
 * Type for a valid name for a member permission.
 */
export type TMemberPermissionName =
  (typeof AVAILABLE_PERMISSIONS_RAW)[number]['name']

/**
 * Type for a valid description for a member permission.
 */
export type TMemberPermissionDescription =
  (typeof AVAILABLE_PERMISSIONS_RAW)[number]['description']

/**
 * Type for all valid member permissions available.
 */
export type TMemberPermissions = {
  [key in TMemberPermissionId]: MemberPermission
}
