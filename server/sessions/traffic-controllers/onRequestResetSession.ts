import { ServerEmittedError } from '@shared/connect/errors/ServerEmittedError'
import { createServerSessionController } from './createServerSessionController'

/**
 * Called when a member requests to reset the session.
 * @param member The member requesting to reset the session.
 * @param event The event emitted by the member.
 */
export const onRequestResetSession =
  createServerSessionController<'request-reset-session'>(
    async function (this, member, event) {
      // Build request for response data.
      let request = member.buildResponseRequestData(event)

      // If the member does not have the correct permissions
      // to reset the session, then emit an error.
      if (!member.isAuthorized('startEndSessions')) {
        return member.emitError(
          new ServerEmittedError(
            ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
            { request },
          ),
        )
      }

      // Reset the session, emitting an error if the
      // reset is rejected outright.
      let reset: Promise<boolean>
      try {
        reset = this.reset({ request })
      } catch (error: any) {
        if (!(error instanceof ServerEmittedError)) throw error
        return member.emitError(error)
      }

      await reset
    },
  )
