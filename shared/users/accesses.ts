import UserPermission from './permissions'

/**
 * Represents the access of a user using METIS.
 */
export default class UserAccess implements TUserAccess {
  public readonly _id: TUserAccess['_id']
  public readonly name: TUserAccess['name']
  public readonly description: TUserAccess['description']
  public readonly permissions: TUserAccess['permissions']

  public constructor(
    _id: TUserAccess['_id'],
    name: TUserAccess['name'],
    description: TUserAccess['description'],
    permissions: TUserAccess['permissions'],
  ) {
    this._id = _id
    this.name = name
    this.description = description
    this.permissions = permissions
  }

  /**
   * Gets the user access object from the given access ID.
   * @param accessId The access ID used to get the user access object.
   * @returns A user access object.
   */
  public static get(accessId: TUserAccess['_id']): UserAccess {
    return UserAccess.AVAILABLE_ACCESSES[accessId]
  }

  /**
   * The default access ID.
   */
  public static readonly DEFAULT_ID: TUserAccess['_id'] = 'default'

  /**
   * All available accesses in METIS.
   */
  public static readonly AVAILABLE_ACCESSES: TUserAccesses = {
    default: new UserAccess(
      'default',
      'Select an access level',
      'This access level is the default access for all users.',
      [],
    ),
    student: new UserAccess(
      'student',
      'student',
      'This access level is a student which has restricted access to the entire application.',
      [
        UserPermission.AVAILABLE_PERMISSIONS.missions_read,
        UserPermission.AVAILABLE_PERMISSIONS.sessions_join_participant,
        UserPermission.AVAILABLE_PERMISSIONS.sessions_read,
      ],
    ),
    instructor: new UserAccess(
      'instructor',
      'instructor',
      'This access level is an instructor which has restricted access to the entire application.',
      [
        UserPermission.AVAILABLE_PERMISSIONS.sessions_join,
        UserPermission.AVAILABLE_PERMISSIONS.sessions_read,
        UserPermission.AVAILABLE_PERMISSIONS.sessions_write,
        UserPermission.AVAILABLE_PERMISSIONS.missions_read,
        UserPermission.AVAILABLE_PERMISSIONS.missions_write,
        UserPermission.AVAILABLE_PERMISSIONS.users_read_students,
        UserPermission.AVAILABLE_PERMISSIONS.users_write_students,
      ],
    ),
    admin: new UserAccess(
      'admin',
      'admin',
      'This access level is an administrator which has full access to the entire application.',
      [
        UserPermission.AVAILABLE_PERMISSIONS.sessions_join,
        UserPermission.AVAILABLE_PERMISSIONS.sessions_read,
        UserPermission.AVAILABLE_PERMISSIONS.sessions_write,
        UserPermission.AVAILABLE_PERMISSIONS.missions_read,
        UserPermission.AVAILABLE_PERMISSIONS.missions_write,
        UserPermission.AVAILABLE_PERMISSIONS.users_read,
        UserPermission.AVAILABLE_PERMISSIONS.users_write,
      ],
    ),
    revokedAccess: new UserAccess(
      'revokedAccess',
      'revoked access',
      'This access level is for users whose access has been revoked.',
      [],
    ),
  }

  /**
   * Checks whether the given access ID is valid.
   * @param accessId The access ID to check.
   */
  public static isValidAccessId(accessId: TUserAccessId): boolean {
    return (
      accessIds.includes(accessId) &&
      accessId !== this.AVAILABLE_ACCESSES.default._id
    )
  }
}

/* ------------------------------ USER ROLE TYPES ------------------------------ */

/**
 * Type used for the abstract UserAccess class.
 */
export type TUserAccess = {
  /**
   * The user access's ID.
   */
  _id: TUserAccessId
  /**
   * The user access's name.
   */
  name: TUserAccessName
  /**
   * The user access's description.
   */
  description: string
  /**
   * The user access's permissions.
   */
  permissions: UserPermission[]
}

const accessNames = [
  'Select an access level',
  'student',
  'instructor',
  'admin',
  'revoked access',
] as const
export type TUserAccessName = (typeof accessNames)[number]

const accessIds = [
  'default',
  'student',
  'instructor',
  'admin',
  'revokedAccess',
] as const
export type TUserAccessId = (typeof accessIds)[number]
export type TUserAccesses = { [key in TUserAccessId]: UserAccess }
