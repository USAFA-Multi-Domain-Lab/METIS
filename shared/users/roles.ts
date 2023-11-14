import UserPermission from './permissions'

/**
 * Represents the role of a user using METIS.
 */
export default class UserRole implements TUserRole {
  public readonly id: TUserRole['id']
  public readonly name: TUserRole['name']
  public readonly description: TUserRole['description']
  public readonly permissions: TUserRole['permissions']

  public constructor(
    id: TUserRole['id'],
    name: TUserRole['name'],
    description: TUserRole['description'],
    permissions: TUserRole['permissions'],
  ) {
    this.id = id
    this.name = name
    this.description = description
    this.permissions = permissions
  }

  /**
   * Gets the user role object from the given role ID.
   * @param {TUserRole['id']} roleID The role ID used to get the user role object.
   * @returns {UserRole} A user role object.
   */
  public static get(roleID: TUserRole['id']): UserRole {
    return UserRole.AVAILABLE_ROLES[roleID]
  }

  /**
   * The default role ID.
   */
  public static readonly DEFAULT_ID: TUserRole['id'] = 'default'

  /**
   * All available roles in METIS.
   */
  public static readonly AVAILABLE_ROLES: TUserRoles = {
    default: new UserRole(
      'default',
      'Select a role',
      'This role is the default role for all users.',
      [],
    ),
    student: new UserRole(
      'student',
      'student',
      'This role is a student which has restricted access to the entire application.',
      [UserPermission.AVAILABLE_PERMISSIONS.READ],
    ),
    instructor: new UserRole(
      'instructor',
      'instructor',
      'This role is an instructor which has restricted access to the entire application.',
      [
        UserPermission.AVAILABLE_PERMISSIONS.READ,
        UserPermission.AVAILABLE_PERMISSIONS.WRITE,
        UserPermission.AVAILABLE_PERMISSIONS.DELETE,
      ],
    ),
    admin: new UserRole(
      'admin',
      'admin',
      'This role is an administrator which has full access to the entire application.',
      [
        UserPermission.AVAILABLE_PERMISSIONS.READ,
        UserPermission.AVAILABLE_PERMISSIONS.WRITE,
        UserPermission.AVAILABLE_PERMISSIONS.DELETE,
      ],
    ),
    revokedAccess: new UserRole(
      'revokedAccess',
      'revoked access',
      'This role is for users whose access has been revoked.',
      [],
    ),
  }

  /**
   * Checks whether the given role ID is valid.
   * @param {TUserRoleID} roleID The role ID to check.
   */
  public static isValidRoleID(roleID: TUserRoleID): boolean {
    return (
      roleIDs.includes(roleID) && roleID !== this.AVAILABLE_ROLES.default.id
    )
  }

  /**
   * The roles that have restricted access to certain pages.
   * @deprecated ***This is no longer supported and will be removed in the future.***
   */
  public static readonly RESTRICTED_ACCESS_ROLES: TUserRoleName[] = [
    'instructor',
    'admin',
  ]
  /**
   * The roles that have full access to all pages.
   * @deprecated ***This is no longer supported and will be removed in the future.***
   */
  public static readonly FULL_ACCESS_ROLES: TUserRoleName[] = ['admin']
}

/* ------------------------------ USER ROLE TYPES ------------------------------ */

/**
 * Type used for the abstract UserRole class.
 */
export type TUserRole = {
  /**
   * The user role's ID.
   */
  id: TUserRoleID
  /**
   * The user role's name.
   */
  name: TUserRoleName
  /**
   * The user role's description.
   */
  description: string
  /**
   * The user role's permissions.
   */
  permissions: UserPermission[]
}

const roleNames = [
  'Select a role',
  'student',
  'instructor',
  'admin',
  'revoked access',
] as const
export type TUserRoleName = (typeof roleNames)[number]

const roleIDs = [
  'default',
  'student',
  'instructor',
  'admin',
  'revokedAccess',
] as const
export type TUserRoleID = (typeof roleIDs)[number]
export type TUserRoles = { [key in TUserRoleID]: UserRole }
