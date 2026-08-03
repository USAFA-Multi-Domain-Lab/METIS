import type {
  TBuildResponseDataOptions,
  TClientHandler,
} from '@server/connect/ClientConnection'
import { ClientConnection } from '@server/connect/ClientConnection'
import { sessionLogger } from '@server/logging'
import type { TTargetEnvExposedMember } from '@server/target-environments/context/TargetEnvContext'
import type { ServerUser } from '@server/users/ServerUser'
import type {
  TClientEvent,
  TClientEvents,
  TRequestEvents,
  TRequestMethod,
  TResponseEvent,
  TServerEvents,
  TServerMethod,
} from '@shared/connect'
import { ServerEmittedError } from '@shared/connect/errors/ServerEmittedError'
import type { TMissionJsonOptions } from '@shared/missions/Mission'
import { type TMemberRoleId } from '@shared/sessions/members/MemberRole'
import type { TSessionRealmJson } from '@shared/sessions/SessionRealm'
import {
  SessionMember,
  type TSessionMemberAssignment,
} from '@shared/sessions/members/SessionMember'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import type { SessionServer } from './SessionServer'
import { onAcknowledgeSessionPanelAlert } from './traffic-controllers/onAcknowledgeSessionPanelAlert'
import { onFetchSessionPanelAlerts } from './traffic-controllers/onFetchSessionPanelAlerts'
import { onRequestAcknowledgeNodeAlert } from './traffic-controllers/onRequestAcknowledgeNodeAlert'
import { onRequestAssignForce } from './traffic-controllers/onRequestAssignForce'
import { onRequestAssignRole } from './traffic-controllers/onRequestAssignRole'
import { onRequestBan } from './traffic-controllers/onRequestBan'
import { onRequestConfigUpdate } from './traffic-controllers/onRequestConfigUpdate'
import { onRequestEndSession } from './traffic-controllers/onRequestEndSession'
import { onRequestExecuteAction } from './traffic-controllers/onRequestExecuteAction'
import { onRequestKick } from './traffic-controllers/onRequestKick'
import { onRequestOpenNode } from './traffic-controllers/onRequestOpenNode'
import { onRequestResetSession } from './traffic-controllers/onRequestResetSession'
import { onRequestSendChatMessage } from './traffic-controllers/onRequestSendChatMessage'
import { onRequestSendOutput } from './traffic-controllers/onRequestSendOutput'
import { onRequestStartSession } from './traffic-controllers/onRequestStartSession'
import { onRequestSwitchRealm } from './traffic-controllers/onRequestSwitchRealm'
import { onRequestUnban } from './traffic-controllers/onRequestUnban'

/**
 * Server-side representation of a session member.
 */
export class ServerSessionMember extends SessionMember<TMetisServerComponents> {
  /**
   * This is a registry, not of active listeners, but the
   * methods and corresponding handlers for all listeners
   * that should be added and removed as the member's connection is
   * attached and dropped by {@link join} and {@link leave}. This helps
   * ensure there is no mismatch in adding and removing listeners, such as
   * adding a listener and forgetting to remove it, or vice versa.
   * @note Each handler runs with the session bound as `this`, so these
   * are session traffic controllers registered per member rather than
   * anything the member handles itself.
   */
  private static readonly listenerInputRegistry = [
    // ^^ Has no type annotation to make the type exact.
    ['request-start-session', onRequestStartSession],
    ['request-end-session', onRequestEndSession],
    ['request-reset-session', onRequestResetSession],
    ['request-config-update', onRequestConfigUpdate],
    ['request-kick', onRequestKick],
    ['request-ban', onRequestBan],
    ['request-unban', onRequestUnban],
    ['request-assign-force', onRequestAssignForce],
    ['request-assign-role', onRequestAssignRole],
    ['request-open-node', onRequestOpenNode],
    ['request-execute-action', onRequestExecuteAction],
    ['request-send-output', onRequestSendOutput],
    ['request-acknowledge-node-alert', onRequestAcknowledgeNodeAlert],
    ['request-send-chat-message', onRequestSendChatMessage],
    ['request-switch-realm', onRequestSwitchRealm],
    ['acknowledge-session-panel-alert', onAcknowledgeSessionPanelAlert],
    ['fetch-session-panel-alerts', onFetchSessionPanelAlerts],
  ] as const

  /** Private cache for {@link connection} */
  private _connection: ClientConnection | null
  /**
   * The WS connection to the client where the given user is logged in,
   * or `null` while the member is a ghost.
   * @note Attached by {@link join} and dropped by {@link leave}, which
   * keep the member's session listeners in step with it. Nothing else
   * may swap the connection out, since listeners can only be removed
   * from the connection they were registered on.
   */
  public get connection(): ClientConnection | null {
    return this._connection
  }

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
   * The session listeners this member has registered on its own
   * connection, tracked by handler reference.
   * @note Populated by {@link addListeners} and cleared by
   * {@link removeListeners}.
   */
  private activeHandlers: TClientHandler<any>[]

  /**
   * Options for serializing a mission for this member, exposing only
   * what the member's permissions and force assignment allow.
   * @note Every mission served to a member — the realm they play in and
   * the session's template alike — is serialized with these, so what a
   * member may see is decided here and nowhere else.
   */
  public get missionJsonOptions(): TMissionJsonOptions {
    let options: TMissionJsonOptions = {
      forceExposure: { expose: 'none' },
      fileExposure: { expose: 'none' },
      sessionDataExposure: { expose: 'member-specific', memberId: this._id },
      rootEffectsExposure: { expose: 'none' },
    }

    // Complete visibility takes precedence over any force assignment,
    // and is the only level that sees root effects.
    if (this.isAuthorized('completeVisibility')) {
      options.forceExposure = { expose: 'all' }
      options.fileExposure = { expose: 'all' }
      options.rootEffectsExposure = { expose: 'all' }
    }
    // Otherwise a member assigned to a force sees that force and the
    // files it can reach.
    else if (this.assignedForceId) {
      options.forceExposure = {
        expose: 'force-with-revealed-nodes',
        forceId: this.assignedForceId,
      }
      options.fileExposure = {
        expose: 'accessible',
        forceId: this.assignedForceId,
      }
    }

    return options
  }

  /**
   * The realm the member is subscribed to, serialized under
   * {@link missionJsonOptions}.
   */
  public get subscribedRealmJson(): TSessionRealmJson {
    return this.subscribedRealm.toJson(this.missionJsonOptions)
  }

  /**
   * @param _id The unique ID of the session member.
   * @param user The user the member represents.
   * @param assignment The member's role, force, and realm assignment.
   * @param session The session to which the member belongs.
   * @param subscribedRealmId The ID of the realm to which the member is
   * subscribed.
   * @note A new member starts without a connection and is not joined
   * until {@link join} attaches one, so a member whose join is rejected
   * never appears — or listens — as a live participant.
   */
  private constructor(
    _id: string,
    user: ServerUser,
    assignment: TSessionMemberAssignment,
    session: SessionServer,
    subscribedRealmId: string,
  ) {
    super(_id, user, assignment, session, subscribedRealmId)
    this._connection = null
    this._banned = false
    this._joined = false
    this.activeHandlers = []
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
   * Registers a session listener on the member's connection for every
   * entry in {@link listenerInputRegistry}, tracking each one in
   * {@link activeHandlers} so it can be removed again individually.
   * @note Expects {@link join} to have already removed the listeners of
   * any previous connection, which cannot be done from here — by the time
   * this runs, the connection those listeners belong to is no longer the
   * one attached.
   * @note A no-op for a ghost member, who has no connection to listen on.
   */
  private addListeners(): void {
    if (!this._connection) return

    for (let [method, handler] of ServerSessionMember.listenerInputRegistry) {
      let wrappedHandler: TClientHandler<any> = (event) => {
        // Controllers may run synchronously or asynchronously. Route a
        // synchronous throw and an async rejection through the same
        // backstop so one member's request can never escalate into an
        // unhandled rejection — which, under Node's default policy, would
        // surface as an uncaught exception and take down the whole process.
        try {
          let result = handler(this, event) as unknown
          if (result instanceof Promise) {
            result.catch((error) => this.handleControllerError(event, error))
          }
        } catch (error) {
          this.handleControllerError(event, error)
        }
      }
      this._connection.addEventListener(method, wrappedHandler)
      this.activeHandlers.push(wrappedHandler)
    }
  }

  /**
   * Removes every session listener this member registered from its
   * connection and stops tracking them.
   * @note Called before the member's connection is replaced or dropped,
   * since the handlers can only be removed from the connection they were
   * registered on.
   */
  private removeListeners(): void {
    for (let handler of this.activeHandlers) {
      this._connection?.removeEventListener(handler)
    }
    this.activeHandlers = []
  }

  /**
   * Backstop for errors escaping a session traffic controller. Expected
   * failures throw a {@link ServerEmittedError}, which the controller has
   * already surfaced to this member — those are ignored here. Anything
   * else is an unexpected error (a bug, a null deref, etc.): it is logged
   * for diagnosis and reported to this member as a generic server error,
   * keeping the failure scoped to the offending request instead of
   * crashing the process.
   * @param event The client event being handled when the error occurred.
   * @param error The error thrown (or rejected) by the controller.
   */
  private handleControllerError(event: TClientEvent, error: unknown): void {
    // A ServerEmittedError is an expected failure the controller has
    // already emitted to the member; nothing more to do.
    if (error instanceof ServerEmittedError) return

    sessionLogger.error(
      `Unexpected error in session traffic controller for "${event.method}" ` +
        `(session ${this.session._id}, member ${this.userId}):`,
      error,
    )

    // Correlate the error with the originating request when possible; the
    // two non-request listeners (panel-alert ack/fetch) carry no requestId.
    let request =
      'requestId' in event
        ? this.buildResponseRequestData(event as TClientEvents[TRequestMethod])
        : undefined

    this.emitError(
      new ServerEmittedError(ServerEmittedError.CODE_SERVER_ERROR, { request }),
    )
  }

  /**
   * Attaches the given connection to the member, marks them as joined,
   * and registers the session's listeners on that connection.
   * @param connection The WS connection for the member.
   * @note Used both when a member first joins and whenever their
   * connection is replaced (a reconnect, or a ghost rejoining), so the
   * listeners are always torn off the outgoing connection before the new
   * one is wired up.
   */
  public join(connection: ClientConnection): void {
    // Drop the listeners registered on any previous connection while it
    // is still the one being tracked.
    this.removeListeners()
    this._connection = connection
    this._joined = true
    this.addListeners()
  }

  /**
   * Removes the member from the session and performs
   * any necessary clean up.
   */
  public leave(): void {
    // Remove the listeners while the connection they were registered on
    // is still attached.
    this.removeListeners()
    this.session.onMemberLeave(this)
    this._joined = false
    this._connection?.login.onMetisSessionLeave()
    this._connection = null
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
   * Lifts the member's ban, allowing them to rejoin the session.
   * @note The member remains a non-joined ghost until they actually
   * rejoin — this only clears the banned flag.
   */
  public unban(): void {
    this._banned = false
  }

  /**
   * Creates a default assignment for a new session member based
   * on the user's permissions and the state of the session.
   * @param user The user who is joining the session.
   * @param session The session which the member is joining.
   * @returns The default assignment for the new session member.
   */
  public static createDefaultAssignment(
    user: ServerUser,
    session: SessionServer,
  ): TSessionMemberAssignment {
    let roleId: TMemberRoleId
    let canManageAny = user.isAuthorized('sessions_join_manager')
    let canManageThisSession =
      user.isAuthorized('sessions_join_manager_native') &&
      session.ownerId === user._id
    let canObserve = user.isAuthorized('sessions_join_observer')
    let canParticipate = user.isAuthorized('sessions_join_participant')

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
   * @param user The user who is joining the session.
   * @param session The session in which the member is joining.
   * @returns A new {@link ServerSessionMember} object.
   * @note The member has no connection until {@link join} attaches one.
   */
  public static createNew(
    user: ServerUser,
    session: SessionServer,
  ): ServerSessionMember {
    return new ServerSessionMember(
      StringToolbox.generateRandomId(),
      user,
      this.createDefaultAssignment(user, session),
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
