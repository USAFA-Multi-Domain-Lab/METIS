import { createClientSessionController } from './createClientSessionController'

/**
 * Handles an event from the server indicating a new alert
 * was created for a node.
 * @param member The client's session member.
 * @param event The event emitted by the server.
 */
export const onNodeAlertAdded =
  createClientSessionController<'node-alert-added'>(
    function (this, member, event) {
      const { message, severityLevel, ids: alerts } = event.data
      for (const { nodeId, alertId } of alerts) {
        let node = this.subscribedMission.getNodeById(nodeId)
        if (!node) {
          console.warn(
            `Node "${nodeId}" was not found. This is likely due to an effect being applied to a node that has not yet been revealed to the user.`,
          )
          continue
        }
        node.onAlert({
          _id: alertId,
          nodeId,
          message,
          severityLevel,
          acknowledged: false,
        })
      }
    },
  )
