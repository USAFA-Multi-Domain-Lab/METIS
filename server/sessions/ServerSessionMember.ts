import type {
  ServerEmittedError,
  TServerEvents,
  TServerMethod,
} from 'metis/connect'
import type { TMemberRoleId } from 'metis/sessions'
import { MemberRole, SessionMember } from 'metis/sessions'
import { StringToolbox } from 'metis/toolbox'
import type { ClientConnection } from '../connect'
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
