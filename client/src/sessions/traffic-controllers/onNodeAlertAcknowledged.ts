import { createClientSessionController } from './createClientSessionController'

/**
 * Handles an event from the server indicating that a
 * node alert has been acknowledged.
 * @param member The client's session member.
 * @param event The event emitted by the server.
 */
export const onNodeAlertAcknowledged =
  createClientSessionController<'node-alert-acknowledged'>(
    function (this, member, event) {
      const { nodeId, alertId } = event.data
      const node = this.subscribedMission.getNodeById(nodeId)
      if (!node) {
        return console.warn(`Node "${nodeId}" was not found.`)
      }
      node.onAlertAcknowledgement(alertId)
    },
  )
