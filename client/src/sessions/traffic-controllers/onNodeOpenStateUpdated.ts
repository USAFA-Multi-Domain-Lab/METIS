import { createClientSessionController } from './createClientSessionController'

/**
 * Handles when the open state of one or more nodes is updated.
 * @param member The client's session member.
 * @param event The event emitted by the server.
 */
export const onNodeOpenStateUpdated =
  createClientSessionController<'node-open-state-updated'>(
    function (this, member, event) {
      let { nodes, opened } = event.data
      this.onChangeNodeOpenState(nodes, opened)
    },
  )
