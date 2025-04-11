import { TNonEmptyArray } from 'metis/toolbox/arrays'
import { TSessionAuthParam } from '.'
import MemberPermission from './permissions'

/* -- CONSTANTS -- */

const AVAILABLE_ROLES_RAW = [
  {
    _id: 'participant',
    name: 'Participant',
    description:
      'Member of a session that is assigned to a force and manipulates nodes within that force.',
    permissions: [
      MemberPermission.AVAILABLE_PERMISSIONS.forceAssignable,
      MemberPermission.AVAILABLE_PERMISSIONS.manipulateNodes,
      MemberPermission.AVAILABLE_PERMISSIONS.roleAssignable,
    ] as MemberPermission[],
  } as const,
  {
    _id: 'observer_limited',
    name: 'Limited Observer',
    description:
      'Member of a session that cannot do anything, but has a limited view of their assigned force and can observe the session play out.',
    permissions: [
      MemberPermission.AVAILABLE_PERMISSIONS.forceAssignable,
      MemberPermission.AVAILABLE_PERMISSIONS.roleAssignable,
    ] as MemberPermission[],
  } as const,
  {
    _id: 'observer',
    name: 'Observer',
    description:
      'Member of a session that cannot do anything, but has a complete view of all forces and can observe the session play out.',
    permissions: [
      MemberPermission.AVAILABLE_PERMISSIONS.completeVisibility,
    ] as MemberPermission[],
  } as const,
  {
    _id: 'manager',
    name: 'Manager',
    description:
      'Member of a session that has full control of a session and its members. They have full access to all forces and can manipulate them without restrictions.',
    permissions: [
      MemberPermission.AVAILABLE_PERMISSIONS.manipulateNodes,
      MemberPermission.AVAILABLE_PERMISSIONS.configureSessions,
      MemberPermission.AVAILABLE_PERMISSIONS.manageSessionMembers,
      MemberPermission.AVAILABLE_PERMISSIONS.startEndSessions,
      MemberPermission.AVAILABLE_PERMISSIONS.completeVisibility,
      MemberPermission.AVAILABLE_PERMISSIONS.cheats,
    ] as MemberPermission[],
  } as const,
] as const

/* -- CLASSES -- */

/**
 * Represents the role of a member in a session.
 */
export default class MemberRole implements TGenericMemberRole {
  public readonly _id: TGenericMemberRole['_id']
  public readonly name: TGenericMemberRole['name']
  public readonly description: TGenericMemberRole['description']
  public readonly permissions: TGenericMemberRole['permissions']

  public constructor(
    _id: TGenericMemberRole['_id'],
    name: TGenericMemberRole['name'],
    description: TGenericMemberRole['description'],
    permissions: TGenericMemberRole['permissions'],
  ) {
    this._id = _id
    this.name = name
    this.description = description
    this.permissions = permissions
  }

  /**
   * Checks to see if the role is authorized to perform an action
   * by comparing the role's permissions to the permissions
   * required to perform the action.
   * @param requiredPermissions The permission(s) required to perform the action.
   * @returns Whether the role is authorized to perform the action.
   * @note Both `MemberPermission` objects and their IDs are accepted as valid
   * arguments for `requiredPermissions`. Optionally an array can be passed to
   * check for multiple permissions.
   * @example // Check if the role has the 'manipulateNodes' permission:
   * role.isAuthorized(MemberPermission.AVAILABLE_PERMISSIONS.manipulateNodes)
   * @example // Check if the role has the 'completeVisibility' and 'configureSessions' permissions:
   * role.isAuthorized(['completeVisibility', 'configureSessions'])
   */
  public isAuthorized = (requiredPermissions: TSessionAuthParam): boolean => {
    let simplifiedReqPermissions: MemberPermission[] = []

    // Convert the required permissions to an array of permission.
    if (Array.isArray(requiredPermissions)) {
      simplifiedReqPermissions = requiredPermissions.map((permission) =>
        permission instanceof MemberPermission
          ? permission
          : MemberPermission.AVAILABLE_PERMISSIONS[permission],
      )
    } else {
      simplifiedReqPermissions = [
        requiredPermissions instanceof MemberPermission
          ? requiredPermissions
          : MemberPermission.AVAILABLE_PERMISSIONS[requiredPermissions],
      ]
    }

    // Determine if the role has the required permissions.
    return simplifiedReqPermissions.every((permission) =>
      this.permissions.includes(permission),
    )
  }

  /**
   * All available member roles in METIS.
   */
  public static readonly AVAILABLE_ROLES: TMemberRoles = (() => {
    let roles: TMemberRoles = {} as TMemberRoles
    AVAILABLE_ROLES_RAW.forEach(
      ({ _id, name, description, permissions }) =>
        (roles[_id] = new MemberRole(_id, name, description, permissions)),
    )
    return roles
  })()

  /**
   * All available assignable member roles in METIS.
   */
  public static readonly ASSIGNABLE_ROLES: MemberRole[] = [
    MemberRole.AVAILABLE_ROLES.participant,
    MemberRole.AVAILABLE_ROLES.observer_limited,
  ]

  /**
   * All available member role IDs in METIS.
   */
  public static readonly AVAILABLE_ROLE_IDS = AVAILABLE_ROLES_RAW.map(
    ({ _id }) => _id,
  ) as TNonEmptyArray<TMemberRoleId>

  /**
   * Gets the member role object from the given role ID.
   * @param roleId The role ID used to get the member role object.
   * @returns A member role object.
   */
  public static get(roleId: TGenericMemberRole['_id']): MemberRole {
    return MemberRole.AVAILABLE_ROLES[roleId]
  }

  /**
   * Checks whether the given role ID is valid.
   * @param roleId The role ID to check.
   */
  public static isValidRoleId(roleId: TMemberRoleId): boolean {
    return this.AVAILABLE_ROLE_IDS.includes(roleId)
  }
}

/* -- TYPES -- */

/**
 * Generic type for a member role.
 */
export type TGenericMemberRole = {
  /**
   * The member role's ID.
   */
  _id: TMemberRoleId
  /**
   * The member role's name.
   */
  name: TMemberRoleName
  /**
   * The member role's description.
   */
  description: TMemberRoleDescription
  /**
   * The member role's permissions.
   */
  permissions: MemberPermission[]
}

/**
 * Type for a valid ID for a member role.
 */
export type TMemberRoleId = (typeof AVAILABLE_ROLES_RAW)[number]['_id']

/**
 * Type for a valid name for a member role.
 */
export type TMemberRoleName = (typeof AVAILABLE_ROLES_RAW)[number]['name']

/**
 * Type for a valid description for a member role.
 */
export type TMemberRoleDescription =
  (typeof AVAILABLE_ROLES_RAW)[number]['description']

/**
 * Type for all valid member roles available.
 */
export type TMemberRoles = {
  [key in TMemberRoleId]: MemberRole
}
