import { MetisComponent } from '../../MetisComponent'
import type { TForce } from '../../missions/forces/MissionForce'
import type { TUser, TUserExistingJson } from '../../users/User'
import { MissionSession, type TSession } from '../MissionSession'
import type { TRealm } from '../SessionRealm'
import type { TSessionAuthParam } from './MemberPermission'
import { MemberRole, type TMemberRoleId } from './MemberRole'

/**
 * Represents a user using METIS.
 */
export abstract class SessionMember<
  T extends TMetisBaseComponents = TMetisBaseComponents,
> extends MetisComponent {
  // Overridden
  public get name(): string {
    return this.user.name
  }
  // Overridden
  public set name(_value: string) {
    throw new Error(
      'Cannot set name of SessionMember directly. Use user.name instead.',
    )
  }

  /**
   * The user that is a member of the session.
   */
  public user: TUser<T>

  /**
   * The ID of the user that is a member of the session.
   */
  public get userId(): TUser<T>['_id'] {
    return this.user._id
  }

  /**
   * The username of the user that is a member of the session.
   */
  public get username(): TUser<T>['username'] {
    return this.user.username
  }

  /**
   * The first name of the user that is a member of the session.
   */
  public get firstName(): TUser<T>['firstName'] {
    return this.user.firstName
  }

  /**
   * The last name of the user that is a member of the session.
   */
  public get lastName(): TUser<T>['lastName'] {
    return this.user.lastName
  }

  /**
   * The member's current assignment — their role ID, force ID, and realm ID.
   */
  public assignment: TSessionMemberAssignment

  /**
   * The role of the member in the session.
   */
  public get role(): MemberRole {
    return MemberRole.get(this.assignment.roleId)
  }

  /**
   * The ID of the member's role in the session.
   */
  public get roleId(): TMemberRoleId {
    return this.assignment.roleId
  }

  /**
   * The force to which the member is explicitly assigned, or `null`.
   * Resolved from the assigned realm's mission. If a force is assigned
   * but could not be found, `null` will be returned in that case also.
   * @note If the session is in a pre-start state, this means the force
   * cannot be resolved yet, since the realm has not been minted.
   * If a force is needed for display purposes, use {@link assignedTemplateForce},
   * which isn't the force the member will operate in, but it does hold
   * display data that can be used before session start.
   */
  public get assignedForce(): TForce<T> | null {
    return (
      this.assignedRealm?.mission.getForceById(this.assignment.forceId) ?? null
    )
  }

  /**
   * The force within the session's mission template which corresponds
   * to the member's assigned force ID. The actual force within which the
   * member will operate is {@link assignedForce}, which is resolved from
   * the assigned realm's mission. However, before the session is started,
   * the realm has not yet been minted. Therefore, this property can be used
   * to access display data for the force, such as name and color, before
   * the session is started.
   * @note If unassigned, this will resolve to `null`.
   */
  public get assignedTemplateForce(): TForce<T> | null {
    return this.session.mission.getForceById(this.assignment.forceId) ?? null
  }

  /**
   * The realm to which the member is explicitly assigned, or `null`.
   * Resolved from the session's realm list by the stored realm ID.
   * @note If a realm is assigned but could not be found, `null` will
   * be returned in that case also.
   *
   */
  public get assignedRealm(): TRealm<T> | null {
    return this.session.getRealm(this.assignment.realmId) ?? null
  }

  /**
   * The ID of the assigned force, or `null`, if
   * not assigned to a force.
   */
  public get assignedForceId(): string | null {
    return this.assignment.forceId
  }

  /**
   * The ID of the assigned realm, or `null`, if
   * not assigned to a realm.
   */
  public get assignedRealmId(): string | null {
    return this.assignment.realmId
  }

  /**
   * The ID of the realm this member is currently subscribed to for routing.
   * Can be updated independently (e.g. when a manager switches the realm
   * they are viewing).
   */
  public subscribedRealmId: string

  /**
   * The realm this member is subscribed to, resolved from {@link subscribedRealmId}.
   * Falls back to {@link MissionSession.defaultRealm} if the ID cannot be found.
   */
  public get subscribedRealm(): TRealm<T> {
    return (
      this.session.getRealm(this.subscribedRealmId) ?? this.session.defaultRealm
    )
  }

  /**
   * Whether the member is currently joined (online) in the session.
   * @note A member who quits but retains a force or realm assignment is kept
   * in the session as a ghost with this set to `false`, so managers can
   * still see them and so their assignment is restored on rejoin.
   */
  public abstract joined: boolean

  /**
   * If true, this member will not be permitted to rejoin the session,
   * unless ban is reverted.
   */
  public abstract banned: boolean

  /**
   * Whether the member is currently joined, not joined,
   * or banned.
   */
  public get status(): TSessionMemberStatus {
    if (this.banned) return 'banned'
    return this.joined ? 'joined' : 'not-joined'
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
  public get isAssignedToForce(): boolean {
    return this.assignment.forceId !== null
  }

  /**
   * Whether the member has been assigned to a realm.
   */
  public get isAssignedToRealm(): boolean {
    return this.assignment.realmId !== null
  }

  /**
   * Creates a prefix for an output message that is
   * displayed in a force's output panel.
   */
  public get outputPrefix(): string {
    return `${this.username.replaceAll(' ', '-')}:`
  }

  /**
   * Creates a new SessionMember object.
   * @param _id The unique ID of the session member.
   * @param user The user that is a member of the session.
   * @param assignment The member's role, force, and realm assignment.
   * @param session The session to which the member belongs.
   */
  protected constructor(
    _id: string,
    user: TUser<T>,
    assignment: TSessionMemberAssignment,
    session: TSession<T>,
    subscribedRealmId: string,
  ) {
    super(_id, '', false)

    this.user = user
    this.assignment = assignment
    this.session = session
    this.subscribedRealmId = subscribedRealmId
  }

  /**
   * Updates {@link assignment} with a new role ID.
   * @param roleId The new role ID to assign to the
   * member.
   */
  public assignToRole(roleId: TMemberRoleId): void {
    this.assignment.roleId = roleId
  }

  /**
   * Updates {@link assignment} with a new force ID.
   * @param forceId The new force ID to assign to the
   * member, or `null` to unassign.
   */
  public assignToForce(forceId: string | null): void {
    this.assignment.forceId = forceId
  }

  /**
   * Updates {@link assignment} with a new realm ID.
   * @param realm The realm to assign. This can be the
   * ID or the realm itself. `null` will unassign the member
   * from any realm.
   */
  public assignToRealm(realm: string | T['realm'] | null): void {
    if (typeof realm !== 'string' && realm !== null) realm = realm._id
    this.assignment.realmId = realm
  }

  /**
   * Subscribes the member to a realm for routing purposes.
   * @param realm The realm to subscribe to. This can be the
   * ID or the realm itself.
   * @note This does not change the member's assigned realm.
   */
  public subscribeToRealm(realm: string | T['realm']): void {
    if (typeof realm !== 'string') realm = realm._id
    this.subscribedRealmId = realm
  }

  /**
   * Converts the SessionMember object to JSON.
   * @returns A JSON representation of the session member.
   */
  public toJson(): TSessionMemberJson {
    return {
      _id: this._id,
      user: this.user.toExistingJson(),
      assignment: this.assignment,
      subscribedRealmId: this.subscribedRealmId,
      joined: this.joined,
      banned: this.banned,
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
 * Extracts the member type from a registry of METIS
 * components type that extends `TMetisBaseComponents`.
 * @param T The type registry.
 * @returns The member type.
 */
export type TMember<T extends TMetisBaseComponents> = T['member']

/**
 * The membership status of a session member.
 * @option 'joined' currently joined (online) in the session.
 * @option 'not-joined' a ghost member who has quit but retains an assignment.
 * @option 'banned' banned from the session and cannot rejoin.
 */
export type TSessionMemberStatus = 'joined' | 'not-joined' | 'banned'

/**
 * The stored assignment of a session member — their role, force, and realm
 * expressed as IDs.
 * @note Complete-visibility members aren't assigned forces and realms since
 * they can float between all realms and forces.
 */
export type TSessionMemberAssignment = {
  roleId: TMemberRoleId
  forceId: string | null
  realmId: string | null
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
  user: TUserExistingJson
  /**
   * The member's role, force, and realm assignment expressed as IDs.
   */
  assignment: TSessionMemberAssignment
  /**
   * The ID of the realm this member is currently subscribed to.
   */
  subscribedRealmId: string
  /**
   * Whether the member is currently joined (online) in the session.
   */
  joined: boolean
  /**
   * Whether the member has been banned from the session and cannot
   * rejoin.
   */
  banned: boolean
}
