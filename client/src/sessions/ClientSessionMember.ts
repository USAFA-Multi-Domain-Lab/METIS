import type { ClientMissionForce } from '@client/missions/forces/ClientMissionForce'
import type { ClientUser } from '@client/users/ClientUser'
import type { TMemberRoleId } from '@shared/sessions/members/MemberRole'
import { MemberRole } from '@shared/sessions/members/MemberRole'
import { SessionMember } from '@shared/sessions/members/SessionMember'
import type { TMetisClientComponents } from '..'
import type { SessionClient } from './SessionClient'

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
