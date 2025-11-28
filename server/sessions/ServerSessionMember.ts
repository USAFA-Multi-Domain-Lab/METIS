import type { ClientConnection } from '@server/connect/ClientConnection'
import type { TTargetEnvExposedMember } from '@server/target-environments/context/TargetEnvContext'
import type { TServerEvents, TServerMethod } from '@shared/connect'
import type { ServerEmittedError } from '@shared/connect/errors/ServerEmittedError'
import type { TMemberRoleId } from '@shared/sessions/members/MemberRole'
import { MemberRole } from '@shared/sessions/members/MemberRole'
import { SessionMember } from '@shared/sessions/members/SessionMember'
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
   * @param role The role of the user in the session.
   */
  private constructor(
    _id: string,
    connection: ClientConnection,
    role: MemberRole,
    forceId: string | null,
    session: SessionServer,
  ) {
    super(_id, connection.user, role, forceId, session)
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
   * Creates a new `ServerSessionMember` object with a random ID.
   * @param connection The WS connection for the user who is joining the session.
   * @param role The role of the user in the session.
   * @param session The session in which the member is joining.
   */
  public static create(
    connection: ClientConnection,
    role: MemberRole | TMemberRoleId,
    session: SessionServer,
    forceId: string | null,
  ): ServerSessionMember {
    // If the role passed is a role ID,
    // get the `MemberRole` object.
    if (typeof role === 'string') role = MemberRole.get(role)

    return new ServerSessionMember(
      StringToolbox.generateRandomId(),
      connection,
      role,
      forceId,
      session,
    )
  }
}
