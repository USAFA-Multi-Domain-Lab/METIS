import type { TBuildResponseDataOptions } from '@server/connect/ClientConnection'
import { ClientConnection } from '@server/connect/ClientConnection'
import { sessionLogger } from '@server/logging'
import type { TTargetEnvExposedMember } from '@server/target-environments/context/TargetEnvContext'
import type {
  TRequestEvents,
  TRequestMethod,
  TResponseEvent,
  TServerEvents,
  TServerMethod,
} from '@shared/connect'
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
  public connection: ClientConnection | null

  /** Private cache for {@link joined} */
  private _joined: boolean
  // Implemented
  public get joined(): boolean {
    return this._joined
  }

  /** Private cache for {@link banned} */
  private _banned: boolean
  // Implemented
  public get banned(): boolean {
    return this._banned
  }

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
    this._banned = false
    this._joined = true
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
    // Never emit to a ghost member — their connection is no longer live.
    if (!this.joined || !this.connection) {
      sessionLogger.warn(
        `Attempted to emit event "${method}" to ghost member ${this.userId} in session ${this.session._id}. Event was not emitted.`,
      )
      return
    }
    this.connection.emit(method, payload)
  }

  /**
   * Emits an error via the connection to
   * with the member's WS client.
   * @param error The error to emit to the client.
   */
  public emitError(error: ServerEmittedError): void {
    // Never emit to a ghost member — their connection is no longer live.
    if (!this.joined || !this.connection) {
      sessionLogger.warn(
        `Attempted to emit error "${error.code}" to ghost member ${this.userId} in session ${this.session._id}. Error was not emitted.`,
      )
      return
    }
    this.connection.emitError(error)
  }

  /**
   * Builds fulfilled `request` property for response events.
   * @param requestEvent The request event for which to create
   * the corresponding response event.
   * @param options Additional options for building the request data.
   * @returns The request data for the response event.
   */
  public buildResponseRequestData<
    TMethod extends TRequestMethod,
    TEvent extends TRequestEvents[TMethod],
  >(
    requestEvent: TEvent,
    options: TBuildResponseDataOptions = {},
  ): TResponseEvent<any, any, TEvent>['request'] {
    return ClientConnection.buildResponseRequestData(
      requestEvent,
      this.userId,
      options,
    )
  }

  /**
   * Removes the member from the session and performs
   * any necessary clean up.
   */
  public leave(): void {
    this.session.onMemberLeave(this)
    this._joined = false
    this.connection?.login.onMetisSessionLeave()
    this.connection = null
  }

  /**
   * Removes the member from the session and flags
   * them as banned, preventing them from rejoining.
   * Any necessary clean up is performed also.
   */
  public ban(): void {
    // Order of operations important here.
    this._banned = true
    this.leave()
  }

  /**
   * Marks the member as newly joined and reattaches the
   * given connection to the member.
   * @param connection The new WS connection for the member.
   */
  public rejoin(connection: ClientConnection): void {
    this.connection = connection
    this._joined = true
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
