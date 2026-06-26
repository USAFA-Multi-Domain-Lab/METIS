import { ServerEmittedError } from '@shared/connect/errors/ServerEmittedError'
import type { ServerSessionMember } from '../ServerSessionMember'
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
      // If the session has already previously started,
      // then emit an error.
      if (this._state !== 'unstarted') {
        return member.emitError(
          new ServerEmittedError(
            ServerEmittedError.CODE_SESSION_CONFLICTING_STATE,
            { request: fulfilledRequest },
          ),
        )
      }

      this.initializeMode()

      // Loop through all members and find any
      // that have no force availability, and
      // mark them for dismissal.
      let toDismiss: ServerSessionMember[] = []
      for (let member of this.joinedMembers) {
        if (
          (!member.isAssignedToForce || !member.isAssignedToRealm) &&
          !member.isAuthorized('completeVisibility')
        ) {
          toDismiss.push(member)
        }
      }

      // Dismiss members found.
      for (let member of toDismiss) {
        // Emit an event to the member that they have
        // been dismissed.
        member.emit('dismissed', { data: {} })
        member.leave()
      }

      // Emit an event to all users that the user list
      // has changed.
      this.emitToAll('session-members-updated', {
        data: {
          members: this.members.map((member) => member.toJson()),
        },
      })

      // Emit starting event. Then, once set up is complete,
      // emit started event.
      this._state = 'starting'
      this.emitToAll('session-starting', {
        data: {},
        request: unfulfilledRequest,
      })

      // Perform setup.
      await this.setUp()

      // If the setup failed...
      if (this.setupFailed) {
        // ...and it is a test session, then destroy it.
        if (this.config.accessibility === 'testing') {
          this._state = 'ended'
          this.destroy()
        }
        // ...do not proceed.
        return
      }

      // Mark the session as started.
      this._state = 'started'
      this.emitStartResponses(event, member, 'session-started')
      // Perform any effect triggered by session start.
      this.applyMissionEffects('session-start')
    },
  )
