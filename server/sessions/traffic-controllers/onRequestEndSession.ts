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
      let fulfilledRequest = member.buildResponseRequestData(event, {
        fulfilled: true,
      })
      let unfulfilledRequest = member.buildResponseRequestData(event, {
        fulfilled: false,
      })
      let connection = member.connection

      // If the member does not have the correct permissions
      // to start the session, then emit an error.
      if (!member.isAuthorized('startEndSessions')) {
        return member.emitError(
          new ServerEmittedError(
            ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
            { request: fulfilledRequest },
          ),
        )
      }
      // If the session is not in the 'started' state,
      // then emit an error.
      if (this._state !== 'started') {
        return member.emitError(
          new ServerEmittedError(
            ServerEmittedError.CODE_SESSION_CONFLICTING_STATE,
            { request: fulfilledRequest },
          ),
        )
      }

      // Emit ending event. Then, once tear down is complete,
      // emit ended event.
      this._state = 'ending'
      this.emitToAll('session-ending', {
        data: {},
        request: unfulfilledRequest,
      })
      this.clearMembers()
      await this.tearDown()

      // If teardown failed, do not proceed.
      if (this.teardownFailed) return

      // Mark the session as ended.
      this._state = 'ended'
      // Must use connection directly because the member
      // has already had the connection detached.
      connection?.emit('session-ended', {
        data: { sessionId: this._id },
        request: fulfilledRequest,
      })
      this.destroy()
    },
  )
