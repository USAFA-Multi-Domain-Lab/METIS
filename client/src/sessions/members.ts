import { TClientMissionTypes } from 'src/missions'
import ClientUser from 'src/users'
import SessionClient from '.'
import SessionMember from '../../../shared/sessions/members'
import MemberRole, {
  TMemberRoleId,
} from '../../../shared/sessions/members/roles'
import ClientMissionForce from 'src/missions/forces'

/**
 * Client-side representation of a session member.
 */
export default class ClientSessionMember extends SessionMember<TClientMissionTypes> {
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
