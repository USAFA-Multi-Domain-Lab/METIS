import { createClientSessionController } from './createClientSessionController'

/**
 * Handles when the session is destroyed.
 * @param member The client's session member.
 * @param event The event emitted by the server.
 */
export const onDestroyed = createClientSessionController<'session-destroyed'>(
  function (this, member, event) {
    this._state = 'ended'
    this.cleanUp()
  },
)
