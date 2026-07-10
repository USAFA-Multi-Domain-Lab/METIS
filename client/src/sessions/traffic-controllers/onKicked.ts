import { createClientSessionController } from './createClientSessionController'

/**
 * Handles when the member is kicked from the session.
 * @param member The client's session member.
 * @param event The event emitted by the server.
 */
export const onKicked = createClientSessionController<'kicked'>(
  function (this, member, event) {
    if (event.data.memberId === member._id) {
      this.cleanUp()
    }
  },
)
