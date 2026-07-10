import { createClientSessionController } from './createClientSessionController'

/**
 * Handles when a node-opened response is received from the server.
 * @param member The client's session member.
 * @param event The event emitted by the server.
 */
export const onNodeOpenedResponse =
  createClientSessionController<'node-opened'>(function (this, member, event) {
    return this.onChangeNodeOpenState(event.data, event.data.opened)
  })
