import type { ClientUser } from '@client/users/ClientUser'
import {
  SessionMember,
  type TSessionMemberAssignment,
} from '@shared/sessions/members/SessionMember'
import type { TMetisClientComponents } from '..'
import type { SessionClient } from './SessionClient'

/**
 * Client-side representation of a session member.
 */
export class ClientSessionMember extends SessionMember<TMetisClientComponents> {
  // Implemented
  public joined: boolean

  // Implemented
  public banned: boolean

  public constructor(
    _id: SessionMember['_id'],
    user: ClientUser,
    assignment: TSessionMemberAssignment,
    session: SessionClient,
    subscribedRealmId: string,
    joined: boolean,
    banned: boolean,
  ) {
    super(_id, user, assignment, session, subscribedRealmId)
    this.joined = joined
    this.banned = banned
  }
}
