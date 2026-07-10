import { createClientSessionController } from './createClientSessionController'

/**
 * Handles when the member quits the session.
 * @param member The client's session member.
 * @param event The event emitted by the server.
 */
export const onQuit = createClientSessionController<'session-quit'>(
  function (this, member, event) {
    this.cleanUp()
  },
)
