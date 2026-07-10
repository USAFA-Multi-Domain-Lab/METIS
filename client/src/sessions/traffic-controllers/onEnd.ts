import { createClientSessionController } from './createClientSessionController'

/**
 * Handles when the session is ended.
 * @param member The client's session member.
 * @param event The event emitted by the server.
 */
export const onEnd = createClientSessionController<'session-ended'>(
  function (this, member, event) {
    this._state = 'ended'
    this.cleanUp()
  },
)
