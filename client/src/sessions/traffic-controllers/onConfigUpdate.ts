import { createClientSessionController } from './createClientSessionController'

/**
 * Handles when the session configuration is updated.
 * @param member The client's session member.
 * @param event The event emitted by the server.
 */
export const onConfigUpdate =
  createClientSessionController<'session-config-updated'>(
    function (this, member, event) {
      this._config = event.data.config
    },
  )
