import { createClientSessionController } from './createClientSessionController'

/**
 * Handles when the session is starting.
 * @param member The client's session member.
 * @param event The event emitted by the server.
 */
export const onStarting = createClientSessionController<'session-starting'>(
  function (this, member, event) {
    this._state = 'starting'
  },
)
