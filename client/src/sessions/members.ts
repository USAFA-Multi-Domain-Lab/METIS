import ClientMissionForce from 'metis/client/missions/forces'
import ClientUser from 'metis/client/users'
import SessionMember from 'metis/sessions/members'
import MemberRole, { TMemberRoleId } from 'metis/sessions/members/roles'
import { TMetisClientComponents } from 'src'
import SessionClient from '.'

/**
 * Client-side representation of a session member.
 */
export class ClientSessionMember extends SessionMember<TMetisClientComponents> {
  public constructor(
    _id: SessionMember['_id'],
    user: ClientUser,
    role: MemberRole | TMemberRoleId,
    forceId: ClientMissionForce['_id'] | null,
    session: SessionClient,
  ) {
    if (typeof role === 'string') role = MemberRole.get(role)
    super(_id, user, role, forceId, session)
  }
}
