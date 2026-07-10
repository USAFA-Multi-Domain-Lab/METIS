import { createClientSessionController } from './createClientSessionController'

/**
 * Handles when the member is dismissed from the session.
 * @param member The client's session member.
 * @param event The event emitted by the server.
 */
export const onDismissed = createClientSessionController<'dismissed'>(
  function (this, member, event) {
    this.cleanUp()
  },
)
