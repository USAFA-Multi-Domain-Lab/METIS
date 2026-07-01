import { ServerEmittedError } from '@shared/connect/errors/ServerEmittedError'
import { createServerSessionController } from './createServerSessionController'

/**
 * Called when a member requests to assign a role to another member.
 * @param member The member requesting to assign a role to another member.
 * @param event The event emitted by the member.
 */
export const onRequestAssignRole =
  createServerSessionController<'request-assign-role'>(
    function (this, member, event) {
      // Build request for response data.
      let request = member.buildResponseRequestData(event)
      // Parse data from event.
      const { memberId: targetMemberId, roleId } = event.data
      // Get the target member to assign.
      const targetMember = this.getMember(targetMemberId)

      // If the member requesting does not have the
      // correct permissions to assign roles,
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
      // If the target member has the `manageSessionMembers`
      // permission, then they cannot have their role
      // changed.
      if (targetMember.isAuthorized('manageSessionMembers')) {
        return member.emitError(
          new ServerEmittedError(
            ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
            {
              request,
            },
          ),
        )
      }

      targetMember.assignToRole(roleId)

      // Emit a response that the assignment has
      // been made.
      member.emit('role-assigned', {
        data: { sessionId: this._id, memberId: targetMemberId, roleId: roleId },
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
