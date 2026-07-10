import { createClientSessionController } from './createClientSessionController'

/**
 * Handles when the session is reset.
 * @param member The client's session member.
 * @param event The event emitted by the server.
 */
export const onReset = createClientSessionController<'session-reset'>(
  function (this, member, event) {
    this.importStartData(event)
  },
)
