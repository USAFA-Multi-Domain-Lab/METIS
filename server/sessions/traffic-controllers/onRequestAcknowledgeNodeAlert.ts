import { ServerEmittedError } from '@shared/connect/errors/ServerEmittedError'
import { createServerSessionController } from './createServerSessionController'

/**
 * Called when a member requests to acknowledge a node alert.
 * @param member The member acknowledging the node alert.
 * @param event The event emitted by the member.
 */
export const onRequestAcknowledgeNodeAlert =
  createServerSessionController<'request-acknowledge-node-alert'>(
    function (this, member, event) {
      try {
        this.requireSessionState(member, event, 'started')

        let { nodeId, alertId } = event.data
        let node = member.subscribedRealm.mission.getNodeById(nodeId)
        let alert = node?.getAlert(alertId)
        let request = member.buildResponseRequestData(event)

        if (!node || !alert) {
          return member.emitError(
            new ServerEmittedError(
              ServerEmittedError.CODE_NODE_ALERT_NOT_FOUND,
              {
                request,
              },
            ),
          )
        }

        // Ensure the member belongs to the node's force or has complete
        // visibility before allowing the acknowledgement.
        if (
          !member.isAuthorized('completeVisibility') &&
          member.assignedForceId !== node.forceId
        ) {
          return member.emitError(
            new ServerEmittedError(
              ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
              { request },
            ),
          )
        }

        alert.acknowledged = true

        // Communicate with all members of the force
        // that the alert has now been acknowledged.
        for (let forceMember of this.getMembersForForce(
          node.forceId,
          member.subscribedRealmId,
        )) {
          forceMember.emit('node-alert-acknowledged', {
            method: 'node-alert-acknowledged',
            data: event.data,
            request,
          })
        }
      } catch (error) {
        // Emit an error if the action could not be executed.
        member.emitError(
          new ServerEmittedError(ServerEmittedError.CODE_SERVER_ERROR, {
            request: member.buildResponseRequestData(event),
            message: 'Failed to acknowledge node alert.',
          }),
        )
      }
    },
  )
