import { ClientSessionMember } from '@client/sessions/ClientSessionMember'
import { ClientUser } from '@client/users/ClientUser'
import { createClientSessionController } from './createClientSessionController'

/**
 * Handles when the lists of members joined in the session
 * changes, due to a join, quit, kick, or ban.
 * @param member The client's session member.
 * @param event The event emitted by the server.
 */
export const onMembersUpdate =
  createClientSessionController<'session-members-updated'>(
    function (this, member, event) {
      let { members } = event.data
      this._members = members.map(
        ({
          _id,
          user: userData,
          assignment,
          subscribedRealmId,
          joined,
          banned,
        }) => {
          return new ClientSessionMember(
            _id,
            ClientUser.fromExistingJson(userData),
            assignment,
            this,
            subscribedRealmId,
            joined,
            banned,
          )
        },
      )
      this.refreshMemberCounts()
    },
  )
