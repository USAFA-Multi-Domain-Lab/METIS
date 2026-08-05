import type { ServerMission } from '@server/missions/ServerMission'
import type { ServerMissionNode } from '@server/missions/nodes/ServerMissionNode'
import type { TServerEvents } from '@shared/connect'
import { ServerEmittedError } from '@shared/connect/errors/ServerEmittedError'
import { createServerSessionController } from './createServerSessionController'

/**
 * Called when a member requests to open a node.
 * @param member The member requesting to open a node.
 * @param event The event emitted by the member.
 */
export const onRequestOpenNode =
  createServerSessionController<'request-open-node'>(
    function (this, member, event) {
      // Organize data.
      let mission: ServerMission = member.subscribedRealm.mission
      let { nodeId } = event.data

      // If the member doesn't have the permission
      // to manipulate nodes, then emit an error.
      if (!member.isAuthorized('manipulateNodes')) {
        return member.emitError(
          new ServerEmittedError(
            ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
            {
              request: member.buildResponseRequestData(event),
            },
          ),
        )
      }

      // Find the node, given the ID.
      let node: ServerMissionNode | undefined = mission.getNodeById(nodeId)

      // If the session is not in the 'started' state,
      // then emit an error.
      if (this.state !== 'started') {
        return member.emitError(
          new ServerEmittedError(
            ServerEmittedError.CODE_SESSION_CONFLICTING_STATE,
            {
              request: member.buildResponseRequestData(event),
            },
          ),
        )
      }
      // If the node is undefined, then emit
      // an error.
      if (node === undefined) {
        return member.emitError(
          new ServerEmittedError(ServerEmittedError.CODE_NODE_NOT_FOUND, {
            request: member.buildResponseRequestData(event),
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
              request: member.buildResponseRequestData(event),
            },
          ),
        )
      }
      // If the node is executable, then emit
      // an error.
      if (!node.openable) {
        return member.emitError(
          new ServerEmittedError(ServerEmittedError.CODE_NODE_NOT_OPENABLE, {
            request: member.buildResponseRequestData(event),
          }),
        )
      }

      try {
        node.openState(true)

        // Extract data from the node.
        const {
          revealedStructure: structure,
          revealedDescendants: descendants,
          revealedDescendantPrototypes: prototypes,
        } = node

        // Construct open event payload.
        //
        // Note: Currently, a shared payload works because
        // all members get the same node data as long as
        // they have visibility for that force. If this ever
        // changes, and node visibility varies member to member
        // of a force, this logic will need to be updated to
        // emit different payloads to different members.
        let payload: TServerEvents['node-opened'] = {
          method: 'node-opened',
          data: {
            _id: nodeId,
            forceId: node.forceId,
            opened: true,
            structure: structure,
            revealedDescendants: descendants.map((n) =>
              n.toJson({
                sessionDataExposure: {
                  expose: 'member-specific',
                  memberId: member._id,
                },
              }),
            ),
            revealedDescendantPrototypes: prototypes.map((p) => p.toJson()),
          },
          request: { event, requesterId: member.userId, fulfilled: true },
        }

        // Emit open event.
        for (let forceMember of this.getJoinedMembersForForce(
          node.force._id,
          member.subscribedRealmId,
        )) {
          forceMember.emit('node-opened', payload)
        }
      } catch (error) {
        // Emit an error if the node could not be opened.
        member.emitError(
          new ServerEmittedError(ServerEmittedError.CODE_SERVER_ERROR, {
            request: member.buildResponseRequestData(event),
            message: 'Failed to open node.',
          }),
        )
      }
    },
  )
