import { createClientSessionController } from './createClientSessionController'

/**
 * Handles when the session is ending.
 * @param member The client's session member.
 * @param event The event emitted by the server.
 */
export const onEnding = createClientSessionController<'session-ending'>(
  function (this, member, event) {
    this._state = 'ending'
    this.cleanUp()
  },
)
