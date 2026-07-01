import { ServerEmittedError } from '@shared/connect/errors/ServerEmittedError'
import { createServerSessionController } from './createServerSessionController'

/**
 * Called when a member requests to kick another member from the session.
 * @param member The member requesting to kick another member.
 * @param event The event emitted by the member.
 */
export const onRequestKick = createServerSessionController<'request-kick'>(
  function (this, member, event) {
    // Build request for response data.
    let request = member.buildResponseRequestData(event)
    // Parse data from event.
    const { memberId: targetMemberId } = event.data
    // Get the target member to kick.
    const targetMember = this.getMember(targetMemberId)

    // If the member requesting does not have the
    // correct permissions to kick participants,
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
    // permission, then they cannot be kicked.
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

    // Emit an event to the target member and to the requester that the
    // target member has been kicked.
    let payload = {
      data: {
        sessionId: this._id,
        memberId: targetMemberId,
        userId: targetMember.userId,
      },
      request,
    }
    member.emit('kicked', payload)
    targetMember.emit('kicked', payload)

    targetMember.leave()

    // Emit an event to all users that the user list
    // has changed.
    this.emitToAll('session-members-updated', {
      data: {
        members: this.members.map((member) => member.toJson()),
      },
    })
  },
)
