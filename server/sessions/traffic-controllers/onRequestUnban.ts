import { ServerEmittedError } from '@shared/connect/errors/ServerEmittedError'
import { createServerSessionController } from './createServerSessionController'

/**
 * Called when a member requests to lift another member's ban from the session.
 * @param member The member requesting to unban another member.
 * @param event The event emitted by the member.
 */
export const onRequestUnban = createServerSessionController<'request-unban'>(
  function (this, member, event) {
    // Build request for response data.
    let request = member.buildResponseRequestData(event)
    // Parse data from event.
    const { memberId: targetMemberId } = event.data
    // Get the target member to unban.
    const targetMember = this.getMember(targetMemberId)

    // If the member requesting does not have the
    // correct permissions to manage members, then
    // emit an error.
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
    // permission, then they cannot be unbanned.
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

    // Lift the ban on the target member.
    targetMember.unban()

    // Emit an event to the requester that the target
    // member's ban has been lifted.
    // *** Note: The target member is a non-joined ghost, so we
    // *** cannot emit to them — they will learn of the lifted ban
    // *** if/when they rejoin.
    member.emit('unbanned', {
      data: {
        sessionId: this._id,
        memberId: targetMemberId,
        userId: targetMember.userId,
      },
      request,
    })

    // Emit an event to all users that the user list
    // has changed.
    this.emitToAll('session-members-updated', {
      data: {
        members: this.members.map((member) => member.toJson()),
      },
    })
  },
)
