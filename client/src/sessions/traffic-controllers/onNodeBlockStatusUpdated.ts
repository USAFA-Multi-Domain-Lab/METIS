import { createClientSessionController } from './createClientSessionController'

/**
 * Handles the blocking and unblocking of nodes.
 * @param member The client's session member.
 * @param event The event emitted by the server.
 */
export const onNodeBlockStatusUpdated =
  createClientSessionController<'node-block-status-updated'>(
    function (this, member, event) {
      const { lookUpData, blocked } = event.data
      for (let lookUpDatum of lookUpData) {
        let node = this.subscribedMission.lookUpNode(lookUpDatum)
        if (node) node.blocked = blocked
      }
    },
  )
