import ClientUser from 'src/users'
import SessionMember from '../../../shared/sessions/members'
import MemberRole, {
  TMemberRoleId,
} from '../../../shared/sessions/members/roles'

/**
 * Client-side representation of a session member.
 */
export default class ClientSessionMember extends SessionMember<ClientUser> {
  public constructor(
    _id: string,
    user: ClientUser,
    role: MemberRole | TMemberRoleId,
  ) {
    if (typeof role === 'string') role = MemberRole.get(role)
    super(_id, user, role)
  }
}
