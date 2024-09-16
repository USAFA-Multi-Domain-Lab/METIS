import { TClientMissionTypes } from 'src/missions'
import ClientUser from 'src/users'
import SessionClient from '.'
import { TCommonMissionForce } from '../../../shared/missions/forces'
import SessionMember from '../../../shared/sessions/members'
import MemberRole, {
  TMemberRoleId,
} from '../../../shared/sessions/members/roles'
import { TCommonUser } from '../../../shared/users'

/**
 * Client-side representation of a session member.
 */
export default class ClientSessionMember extends SessionMember<TClientMissionTypes> {
  public constructor(
    _id: TCommonUser['_id'],
    user: ClientUser,
    role: MemberRole | TMemberRoleId,
    forceId: TCommonMissionForce['_id'] | null,
    session: SessionClient,
  ) {
    if (typeof role === 'string') role = MemberRole.get(role)
    super(_id, user, role, forceId, session)
  }
}
