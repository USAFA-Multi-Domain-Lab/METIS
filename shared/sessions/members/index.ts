import { TCommonMissionTypes } from 'metis/missions'
import { TCommonMissionForce, TForce } from 'metis/missions/forces'
import { TCommonUser, TCommonUserJson, TSessionUser } from 'metis/users'
import { TCommonSession, TSession } from '..'
import MemberPermission from './permissions'
import MemberRole, { TMemberRoleId } from './roles'

/* -- CLASSES -- */

/**
 * Represents a user using METIS.
 */
export default abstract class SessionMember<
  T extends TCommonMissionTypes = TCommonMissionTypes,
> implements TCommonSessionMember
{
  // Implemented
  public _id: string

  // Implemented
  public user: TSessionUser<T>

  // Implemented
  public get userId(): TSessionUser<T>['_id'] {
    return this.user._id
  }

  // Implemented
  public get username(): TSessionUser<T>['username'] {
    return this.user.username
  }

  // Implemented
  public role: MemberRole

  // Implemented
  public get roleId(): TMemberRoleId {
    return this.role._id
  }

  // Implemented
  public forceId: TCommonMissionForce['_id'] | null

  // Implemented
  public get force(): TForce<T> {
    // todo: implement this.
    throw new Error('Method not implemented.')
  }

  // Implemented
  public session: TSession<T>

  // Implemented
  public get isParticipant(): boolean {
    return this.role._id === 'participant'
  }

  // Implemented
  public get isObserver(): boolean {
    return this.role._id === 'observer'
  }

  // Implemented
  public get isManager(): boolean {
    return this.role._id === 'manager'
  }

  // Implemented
  public get isAssigned(): boolean {
    return this.forceId !== null
  }

  /**
   * Creates a new SessionMember object.
   * @param _id The unique ID of the session member.
   * @param user The user that is a member of the session.
   * @param role The role of the user in the session.
   */
  protected constructor(
    _id: string,
    user: TSessionUser<T>,
    role: MemberRole,
    forceId: TCommonMissionForce['_id'] | null,
    session: TSession<T>,
  ) {
    this._id = _id
    this.user = user
    this.role = role
    this.forceId = forceId
    this.session = session
  }

  // Implemented
  public toJson(): TSessionMemberJson {
    return {
      _id: this._id,
      user: this.user.toJson(),
      roleId: this.role._id,
      forceId: this.forceId,
    }
  }

  // Implemented
  public isAuthorized = (requiredPermissions: TSessionAuthParam): boolean =>
    this.role.isAuthorized(requiredPermissions)
}

/* -- TYPES -- */

/**
 * Extracts the session member type from the session types.
 * @param T The session types.
 * @returns The session member type.
 */
export type TMember<T extends TCommonMissionTypes> = T['member']

/**
 * Interface for the abstract `SessionMember` class.
 * @note Any public, non-static properties and functions of the `SessionMember`
 * class must first be defined here for them to be accessible to other
 * mission-related classes.
 */
export interface TCommonSessionMember {
  /**
   * The unique ID of the session member.
   */
  _id: string
  /**
   * The user that is a member of the session.
   */
  user: TCommonUser
  /**
   * The ID of the user that is a member of the session.
   */
  get userId(): TCommonUser['_id']
  /**
   * The username of the user that is a member of the session.
   */
  get username(): TCommonUser['username']
  /**
   * The role of the member in the session.
   */
  role: MemberRole
  /**
   * The ID of the member's role in the session.
   */
  get roleId(): TMemberRoleId
  /**
   * The ID of the force to which the member is assigned.
   * @note If `null`, the member is not assigned to a force.
   */
  forceId: TCommonMissionForce['_id'] | null
  /**
   * The session to which the member belongs.
   */
  session: TCommonSession
  /**
   * Whether the member is a participant in the session.
   */
  get isParticipant(): boolean
  /**
   * Whether the member is an observer in the session.
   */
  get isObserver(): boolean
  /**
   * Whether the member is a manager in the session.
   */
  get isManager(): boolean
  /**
   * Whether the member has been assigned to a force.
   */
  get isAssigned(): boolean
  /**
   * Converts the SessionMember object to JSON.
   * @returns A JSON representation of the session member.
   */
  toJson(): TSessionMemberJson
  /**
   * Checks to see if a member is authorized to perform an action
   * by comparing the member's permissions to the permissions
   * required to perform the action.
   * @param requiredPermissions The permission(s) required to perform the action.
   * @returns Whether the member is authorized to perform the action.
   * @note Both `MemberPermission` objects and their IDs are accepted as valid
   * arguments for `requiredPermissions`. Optionally an array can be passed to
   * check for multiple permissions.
   * @example // Check if the member has the 'manipulateNodes' permission:
   * member.isAuthorized(MemberPermission.AVAILABLE_PERMISSIONS.manipulateNodes)
   * @example // Check if the member has the 'completeVisibility' and 'configureSessions' permissions:
   * member.isAuthorized(['completeVisibility', 'configureSessions'])
   */
  isAuthorized(requiredPermissions: TSessionAuthParam): boolean
}

/**
 * The JSON representation of a User object.
 */
export interface TSessionMemberJson {
  /**
   * The session member's ID.
   */
  _id: string
  /**
   * The user that is a member of the session.
   */
  user: TCommonUserJson
  /**
   * The ID of the member's role in the session.
   */
  roleId: TMemberRoleId
  /**
   * The ID of the force to which the member is assigned.
   * @note If `null`, the member is not assigned to a force.
   */
  forceId: TCommonMissionForce['_id'] | null
}

/**
 * Valid parameters for `SessionMember.isAuthorized` and
 * `MemberRole.isAuthorized`.
 */
export type TSessionAuthParam =
  | MemberPermission
  | MemberPermission['_id']
  | MemberPermission[]
  | MemberPermission['_id'][]
