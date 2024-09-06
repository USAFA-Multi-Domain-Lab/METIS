import SessionMember from 'metis/sessions/members'
import MemberRole, { TMemberRoleId } from 'metis/sessions/members/roles'
import StringToolbox from 'metis/toolbox/strings'
import ClientConnection from '../connect/clients'
import ServerUser from '../users'

/**
 * Server-side representation of a session member.
 */
export default class ServerSessionMember extends SessionMember<ServerUser> {
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
  ) {
    super(_id, connection.user, role)
    this.connection = connection
  }

  /**
   * Creates a new `ServerSessionMember` object with a random ID.
   * @param connection The WS connection for the user who is joining the session.
   * @param role The role of the user in the session.
   */
  public static create(
    connection: ClientConnection,
    role: MemberRole | TMemberRoleId,
  ): ServerSessionMember {
    // If the role passed is a role ID,
    // get the `MemberRole` object.
    if (typeof role === 'string') role = MemberRole.get(role)

    return new ServerSessionMember(
      StringToolbox.generateRandomId(),
      connection,
      role,
    )
  }
}
