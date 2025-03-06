import { TCommonMissionTypes } from 'metis/missions'
import { MissionForce, TForce } from 'metis/missions/forces'
import { TUserJson, TSessionUser } from 'metis/users'
import { TSession } from '..'
import MemberPermission from './permissions'
import MemberRole, { TMemberRoleId } from './roles'

/* -- CLASSES -- */

/**
 * Represents a user using METIS.
 */
export default abstract class SessionMember<
  T extends TCommonMissionTypes = TCommonMissionTypes,
> {
  /**
   * The unique ID of the session member.
   */
  public _id: string

  /**
   * The user that is a member of the session.
   */
  public user: TSessionUser<T>

  /**
   * The ID of the user that is a member of the session.
   */
  public get userId(): TSessionUser<T>['_id'] {
    return this.user._id
  }

  /**
   * The username of the user that is a member of the session.
   */
  public get username(): TSessionUser<T>['username'] {
    return this.user.username
  }

  /**
   * The role of the member in the session.
   */
  public role: MemberRole

  /**
   * The ID of the member's role in the session.
   */
  public get roleId(): TMemberRoleId {
    return this.role._id
  }

  /**
   * The ID of the force to which the member is assigned.
   * @note If `null`, the member is not assigned to a force.
   */
  public forceId: string | null

  /**
   * The force to which the member is assigned.
   * @note If `null`, the member is not assigned to a force.
   */
  public get force(): TForce<T> | null {
    if (this.forceId === null) return null
    return this.session.mission.getForce(this.forceId) ?? null
  }

  /**
   * The session to which the member belongs.
   */
  public session: TSession<T>

  /**
   * Whether the member is a participant in the session.
   */
  public get isParticipant(): boolean {
    return this.role._id === 'participant'
  }

  /**
   * Whether the member is a limited observer in the session.
   */
  public get isLimitedObserver(): boolean {
    return this.role._id === 'observer_limited'
  }

  /**
   * Whether the member is an observer in the session.
   */
  public get isObserver(): boolean {
    return this.role._id === 'observer'
  }

  /**
   * Whether the member is a manager in the session.
   */
  public get isManager(): boolean {
    return this.role._id === 'manager'
  }

  /**
   * Whether the member has been assigned to a force.
   */
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
    forceId: TForce<T>['_id'] | null,
    session: TSession<T>,
  ) {
    this._id = _id
    this.user = user
    this.role = role
    this.forceId = forceId
    this.session = session
  }

  /**
   * Converts the SessionMember object to JSON.
   * @returns A JSON representation of the session member.
   */
  public toJson(): TSessionMemberJson {
    return {
      _id: this._id,
      user: this.user.toJson(),
      roleId: this.role._id,
      forceId: this.forceId,
    }
  }

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
  user: TUserJson
  /**
   * The ID of the member's role in the session.
   */
  roleId: TMemberRoleId
  /**
   * The ID of the force to which the member is assigned.
   * @note If `null`, the member is not assigned to a force.
   */
  forceId: MissionForce['_id'] | null
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
