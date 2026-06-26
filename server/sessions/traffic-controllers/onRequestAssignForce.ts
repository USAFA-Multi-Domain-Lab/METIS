import { ServerEmittedError } from '@shared/connect/errors/ServerEmittedError'
import { createServerSessionController } from './createServerSessionController'

/**
 * Called when a member requests to assign another member to a force.
 * @param member The member requesting to assign another member to a force.
 * @param event The event emitted by the member.
 */
export const onRequestAssignForce =
  createServerSessionController<'request-assign-force'>(
    function (this, member, event) {
      // Build request for response data.
      let request = member.buildResponseRequestData(event)
      // Parse data from event.
      const { memberId: targetMemberId, forceId } = event.data
      // Get the target member to assign.
      const targetMember = this.getMember(targetMemberId)

      // If the member requesting does not have the
      // correct permissions to assign forces,
      // then emit an error.
      if (!member.isAuthorized('manageSessionMembers')) {
        return member.emitError(
          new ServerEmittedError(
            ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
            { request },
          ),
        )
      }
      // If the target member is not found, then emit
      // an error.
      if (!targetMember) {
        return member.emitError(
          new ServerEmittedError(ServerEmittedError.CODE_MEMBER_NOT_FOUND, {
            request,
          }),
        )
      }
      // If the target member does not have the permission
      // to be assigned to a force, then emit an error.
      if (!targetMember.isAuthorized('forceAssignable')) {
        return member.emitError(
          new ServerEmittedError(
            ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
            {
              request,
            },
          ),
        )
      }

      targetMember.assignToForce(forceId)

      // Emit a response that the assignment has
      // been made.
      member.emit('force-assigned', {
        data: { sessionId: this._id, memberId: targetMemberId, forceId },
        request,
      })

      // Emit to all members that the user list has changed.
      this.emitToAll('session-members-updated', {
        data: {
          members: this.members.map((member) => member.toJson()),
        },
      })
    },
  )
