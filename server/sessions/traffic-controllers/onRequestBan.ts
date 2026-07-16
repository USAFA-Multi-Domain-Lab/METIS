import { ServerEmittedError } from '@shared/connect/errors/ServerEmittedError'
import { createServerSessionController } from './createServerSessionController'

/**
 * Called when a member requests to ban another member from the session.
 * @param member The member requesting to ban another member.
 * @param event The event emitted by the member.
 */
export const onRequestBan = createServerSessionController<'request-ban'>(
  function (this, member, event) {
    // Build request for response data.
    let request = member.buildResponseRequestData(event)
    // Parse data from event.
    const { memberId: targetMemberId } = event.data
    // Get the target member to ban.
    const targetMember = this.getMember(targetMemberId)

    // If the member requesting does not have the
    // correct permissions to ban participants,
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
    // permission, then they cannot be banned.
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

    // Emit an event to the target member and to the
    // requester that the target member has been banned.
    let payload = {
      data: {
        sessionId: this._id,
        memberId: targetMemberId,
        userId: targetMember.userId,
      },
      request,
    }
    member.emit('banned', payload)
    targetMember.emit('banned', payload)

    targetMember.ban()

    // Notify all members that the member list has changed.
    this.emitMembersUpdated()
  },
)
