import { createClientSessionController } from './createClientSessionController'

/**
 * Handles when the session is started.
 * @param member The client's session member.
 * @param event The event emitted by the server.
 */
export const onStart = createClientSessionController<'session-started'>(
  function (this, member, event) {
    this.importStartData(event)
  },
)
