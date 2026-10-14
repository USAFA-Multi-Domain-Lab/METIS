import { ServerEmittedError } from '@shared/connect/errors/ServerEmittedError'
import { createServerSessionController } from './createServerSessionController'

/**
 * Called when a member requests to end the session.
 * @param member The member requesting to end the session.
 * @param event The event emitted by the member.
 */
export const onRequestEndSession =
  createServerSessionController<'request-end-session'>(
    async function (this, member, event) {
      // Build request for response data.
      let request = member.buildResponseRequestData(event)
      let connection = member.connection

      // If the member does not have the correct permissions
      // to end the session, then emit an error.
      if (!member.isAuthorized('startEndSessions')) {
        return member.emitError(
          new ServerEmittedError(
            ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
            { request },
          ),
        )
      }
      // End the session, emitting an error if the
      // end is rejected outright.
      let teardown: Promise<boolean>
      try {
        teardown = this.end({ request })
      } catch (error: any) {
        if (!(error instanceof ServerEmittedError)) throw error
        return member.emitError(error)
      }

      // Once tear down is complete, emit ended event.
      // If teardown failed, do not proceed.
      let tornDown = await teardown
      if (!tornDown) return

      // Must use connection directly because the member
      // has already had the connection detached.
      connection?.emit('session-ended', {
        data: { sessionId: this._id },
        request,
      })
    },
  )
