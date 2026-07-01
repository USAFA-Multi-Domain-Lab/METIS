import type { ServerMissionNode } from '@server/missions/nodes/ServerMissionNode'
import { ServerEmittedError } from '@shared/connect/errors/ServerEmittedError'
import { createServerSessionController } from './createServerSessionController'

/**
 * Called when a member requests to send an output.
 * @param member The member requesting to send an output.
 * @param event The event emitted by the member.
 */
export const onRequestSendOutput =
  createServerSessionController<'request-send-output'>(
    function (this, member, event) {
      // Gather details.
      let { key } = event.data
      let request = member.buildResponseRequestData(event)

      // If the session is not in the 'started' state,
      // then emit an error.
      if (this.state !== 'started') {
        return member.emitError(
          new ServerEmittedError(
            ServerEmittedError.CODE_SESSION_CONFLICTING_STATE,
            {
              request,
            },
          ),
        )
      }

      switch (key) {
        case 'pre-execution':
          // Extract the node ID from the event data.
          let { nodeId } = event.data

          // Find the node given the ID.
          let node: ServerMissionNode | undefined =
            member.subscribedRealm.mission.getNodeById(nodeId)

          // If the node is undefined, then emit
          // an error.
          if (node === undefined) {
            return member.emitError(
              new ServerEmittedError(ServerEmittedError.CODE_NODE_NOT_FOUND, {
                request,
              }),
            )
          }

          // If the member doesn't belong to the node's force and doesn't
          // have complete visibility, then emit an error.
          if (
            !member.isAuthorized('completeVisibility') &&
            member.assignedForceId !== node.forceId
          ) {
            return member.emitError(
              new ServerEmittedError(
                ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
                {
                  request,
                },
              ),
            )
          }

          // If the node is not revealed, then
          // emit an error.
          if (!node.revealed) {
            return member.emitError(
              new ServerEmittedError(
                ServerEmittedError.CODE_NODE_NOT_REVEALED,
                {
                  request,
                },
              ),
            )
          }

          try {
            if (node.preExecutionText === '') {
              // Emit an event to the participant that the
              // pre-execution message was sent.
              member.emit('output-sent', {
                data: {
                  key: 'pre-execution',
                  nodeId,
                },
                request: {
                  event,
                  requesterId: member.userId,
                  fulfilled: true,
                },
              })
              return
            }

            // Send an output to the force.
            member.subscribedRealm.sendOutput(
              member.outputPrefix,
              node.preExecutionText,
              { type: 'pre-execution', sourceNodeId: node._id },
              {
                force: node.force,
                member,
              },
            )

            // Emit an event to the participant that the
            // pre-execution message was sent.
            member.emit('output-sent', {
              data: {
                key: 'pre-execution',
                nodeId,
              },
              request: {
                event,
                requesterId: member.userId,
                fulfilled: true,
              },
            })
          } catch (error: any) {
            // Emit an error if the pre-execution message could not be sent.
            member.emitError(
              new ServerEmittedError(ServerEmittedError.CODE_SERVER_ERROR, {
                request,
                message: 'Failed to send pre-execution message.',
              }),
            )
          }
      }
    },
  )
