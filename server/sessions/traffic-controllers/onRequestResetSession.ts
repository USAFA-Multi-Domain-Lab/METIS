import { ServerEmittedError } from '@shared/connect/errors/ServerEmittedError'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
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
      let fulfilledRequest = member.buildResponseRequestData(event, {
        fulfilled: true,
      })
      let unfulfilledRequest = member.buildResponseRequestData(event, {
        fulfilled: false,
      })

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
      // If the session has not been started
      // then emit an error.
      if (this._state === 'unstarted') {
        return member.emitError(
          new ServerEmittedError(
            ServerEmittedError.CODE_SESSION_CONFLICTING_STATE,
            { request: fulfilledRequest },
          ),
        )
      }

      this._state = 'resetting'
      this.emitToAll('session-resetting', {
        data: {},
        request: unfulfilledRequest,
      })

      // Perform teardown.
      await this.tearDown()
      // If teardown failed, do not proceed.
      if (this.teardownFailed) return

      // Assign a new instance ID.
      this._instanceId = StringToolbox.generateRandomId()

      this.resetRealms()

      // Clear all tasks (setup, teardown, and live) for the new
      // instance.
      this._environmentTasks = []

      // Perform setup.
      await this.setUp()
      // If setup failed, do not proceed.
      if (this.setupFailed) return

      // Mark as started and emit the response to
      // all members.
      this._state = 'started'
      this.emitStartResponses(event, member, 'session-reset')

      // Perform any effect triggered by session start.
      this.applyMissionEffects('session-start')
    },
  )
