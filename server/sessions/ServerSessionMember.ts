import type { ClientConnection } from '@server/connect/ClientConnection'
import type { TTargetEnvExposedMember } from '@server/target-environments/context/TargetEnvContext'
import type { TServerEvents, TServerMethod } from '@shared/connect'
import type { ServerEmittedError } from '@shared/connect/errors/ServerEmittedError'
import { type TMemberRoleId } from '@shared/sessions/members/MemberRole'
import {
  SessionMember,
  type TSessionMemberAssignment,
} from '@shared/sessions/members/SessionMember'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import type { SessionServer } from './SessionServer'

/**
 * Server-side representation of a session member.
 */
export class ServerSessionMember extends SessionMember<TMetisServerComponents> {
  /**
   * The WS connection to the client where the given user is logged in.
   */
  public connection: ClientConnection

  /**
   * @param _id The unique ID of the session member.
   * @param connection The WS connection for the user who is joining the session.
   * @param assignment The member's role, force, and realm assignment.
   * @param session The session to which the member belongs.
   * @param subscribedRealmId The ID of the realm to which the member is
   * subscribed.
   */
  private constructor(
    _id: string,
    connection: ClientConnection,
    assignment: TSessionMemberAssignment,
    session: SessionServer,
    subscribedRealmId: string,
  ) {
    super(_id, connection.user, assignment, session, subscribedRealmId)
    this.connection = connection
  }

  /**
   * @returns The properties from the user that are
   * safe to expose in target-environment code.
   */
  public toTargetEnvContext(): TTargetEnvExposedMember {
    return {
      _id: this._id,
      name: this.name,
      username: this.username,
      firstName: this.firstName,
      lastName: this.lastName,
    }
  }

  /**
   * Emits an event to the member's WS client.
   * @param method The method to emit.
   * @param payload The payload to emit.
   */
  public emit<
    TMethod extends TServerMethod,
    TPayload extends Omit<TServerEvents[TMethod], 'method'>,
  >(method: TMethod, payload: TPayload): void {
    this.connection.emit(method, payload)
  }

  /**
   * Emits an error via the connection to
   * with the member's WS client.
   * @param error The error to emit to the client.
   */
  public emitError(error: ServerEmittedError): void {
    this.connection.emitError(error)
  }

  /**
   * Creates a default assignment for a new session member based
   * on the user's permissions and the state of the session.
   * @param connection The WS connection with which the user who is
   * joining the session.
   * @param session The session which the member is joining.
   * @returns The default assignment for the new session member.
   */
  public static createDefaultAssignment(
    connection: ClientConnection,
    session: SessionServer,
  ): TSessionMemberAssignment {
    let roleId: TMemberRoleId
    let canManageAny = connection.user.isAuthorized('sessions_join_manager')
    let canManageThisSession =
      connection.user.isAuthorized('sessions_join_manager_native') &&
      session.ownerId === connection.userId
    let canObserve = connection.user.isAuthorized('sessions_join_observer')
    let canParticipate = connection.user.isAuthorized(
      'sessions_join_participant',
    )

    if (canManageAny || canManageThisSession) {
      roleId = 'manager'
    } else if (canObserve) {
      roleId = 'observer'
    } else if (canParticipate) {
      roleId = 'participant'
    } else {
      roleId = 'access_denied'
    }

    return { roleId, realmId: null, forceId: null }
  }

  /**
   * Creates a new `ServerSessionMember` object with a random ID.
   * @param connection The WS connection for the user who is joining the session.
   * @param session The session in which the member is joining.
   * @returns A new {@link ServerSessionMember} object.
   */
  public static createNew(
    connection: ClientConnection,
    session: SessionServer,
  ): ServerSessionMember {
    return new ServerSessionMember(
      StringToolbox.generateRandomId(),
      connection,
      this.createDefaultAssignment(connection, session),
      session,
      session.defaultRealm._id,
    )
  }

  /**
   * Creates a session-member instance for a user who
   * previously joined the session and has an existing
   * assignment (role, force, and realm).
   * @param connection The WS connection for the user who is joining the session.
   * @param session The session in which the member is joining.
   * @param assignment The member's role, force, and realm assignment.
   * @returns A new {@link ServerSessionMember} object.
   */
  public static createPreviousJoin(
    connection: ClientConnection,
    session: SessionServer,
    assignment: TSessionMemberAssignment,
  ): ServerSessionMember {
    return new ServerSessionMember(
      StringToolbox.generateRandomId(),
      connection,
      assignment,
      session,
      assignment.realmId ?? session.defaultRealm._id,
    )
  }

  /**
   * Emits the same event to each member in a given group.
   * @param group The members to emit the event to.
   * @param method Identifies the type of event being emitted.
   * @param payload The corresponding data for the provided event method.
   */
  public static emitToGroup<
    TMethod extends TServerMethod,
    TPayload extends Omit<TServerEvents[TMethod], 'method'>,
  >(group: ServerSessionMember[], method: TMethod, payload: TPayload): void {
    for (let member of group) {
      member.emit(method, payload)
    }
  }
}
