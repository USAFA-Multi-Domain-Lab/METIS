import { ServerEmittedError } from '@shared/connect/errors/ServerEmittedError'
import { createServerSessionController } from './createServerSessionController'

/**
 * Called when a member requests to start the session.
 * @param member The member requesting to start the session.
 * @param event The event emitted by the member.
 */
export const onRequestStartSession =
  createServerSessionController<'request-start-session'>(
    async function (this, member, event) {
      // Build request for response data.
      let request = member.buildResponseRequestData(event)

      // If the member does not have the correct permissions
      // to start the session, then emit an error.
      if (!member.isAuthorized('startEndSessions')) {
        return member.emitError(
          new ServerEmittedError(
            ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
            { request },
          ),
        )
      }

      // Start the session, emitting an error if the
      // start is rejected outright.
      let setup: Promise<boolean>
      try {
        setup = this.start({ request })
      } catch (error: any) {
        if (!(error instanceof ServerEmittedError)) throw error
        return member.emitError(error)
      }

      await setup
    },
  )
