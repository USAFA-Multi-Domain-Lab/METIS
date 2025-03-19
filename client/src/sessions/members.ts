import { TMetisClientComponents } from 'src'
import ClientMissionForce from 'src/missions/forces'
import ClientUser from 'src/users'
import SessionClient from '.'
import SessionMember from '../../../shared/sessions/members'
import MemberRole, {
  TMemberRoleId,
} from '../../../shared/sessions/members/roles'

/**
 * Client-side representation of a session member.
 */
export default class ClientSessionMember extends SessionMember<TMetisClientComponents> {
  public constructor(
    _id: ClientUser['_id'],
    user: ClientUser,
    role: MemberRole | TMemberRoleId,
    forceId: ClientMissionForce['_id'] | null,
    session: SessionClient,
  ) {
    if (typeof role === 'string') role = MemberRole.get(role)
    super(_id, user, role, forceId, session)
  }
}
