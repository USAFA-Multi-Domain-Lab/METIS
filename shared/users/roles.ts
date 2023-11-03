import UserPermission from './permissions'

/**
 * Interface used for the abstract UserRole class.
 */
export interface IUserRole extends IUserRoleJSON {
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
  /**
   * Converts the UserRole object to JSON.
   */
  toJSON(): IUserRoleJSON
}

/**
 * The JSON representation of a UserRole object.
 */
export interface IUserRoleJSON {
  /**
   * The user role's ID.
   */
  id: TUserRoleID
}

const roleNames = ['Select a role', 'student', 'instructor', 'admin'] as const
export type TUserRoleName = (typeof roleNames)[number]

const roleIDs = ['default', 'student', 'instructor', 'admin'] as const
export type TUserRoleID = (typeof roleIDs)[number]
export type TUserRoles = { [key in TUserRoleID]: UserRole }

/**
 * Represents the role of a user using METIS.
 */
export default class UserRole implements IUserRole {
  public readonly id: IUserRole['id']
  public readonly name: IUserRole['name']
  public readonly description: IUserRole['description']
  public readonly permissions: IUserRole['permissions']

  public constructor(
    id: IUserRole['id'],
    name: IUserRole['name'],
    description: IUserRole['description'],
    permissions: IUserRole['permissions'],
  ) {
    this.id = id
    this.name = name
    this.description = description
    this.permissions = permissions
  }

  /**
   * Default properties for a new UserRole object.
   */
  public static readonly DEFAULT_PROPERTIES: IUserRoleJSON = {
    id: 'default',
  }

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
  }

  /**
   * Checks whether the given role ID is valid.
   * @param {TUserRoleID} roleID The role ID to check.
   */
  public static isValidRoleID(roleID: TUserRoleID): boolean {
    return roleIDs.includes(roleID)
  }

  /**
   * Converts the UserRole object to JSON.
   * @returns {IUserRoleJSON} The JSON representation of the UserRole object.
   */
  public toJSON(): IUserRoleJSON {
    return {
      id: this.id,
    }
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
