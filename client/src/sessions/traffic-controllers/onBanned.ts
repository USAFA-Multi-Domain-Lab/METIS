import { createClientSessionController } from './createClientSessionController'

/**
 * Handles when the member is banned from the session.
 * @param member The client's session member.
 * @param event The event emitted by the server.
 */
export const onBanned = createClientSessionController<'banned'>(
  function (this, member, event) {
    if (event.data.memberId === member._id) {
      this.cleanUp()
    }
  },
)
