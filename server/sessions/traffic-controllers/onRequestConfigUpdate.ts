import { ServerEmittedError } from '@shared/connect/errors/ServerEmittedError'
import { createServerSessionController } from './createServerSessionController'

/**
 * Called when a member requests to update the configuration
 * for the session.
 * @param member The member requesting to update the configuration.
 * @param event The event emitted by the member.
 */
export const onRequestConfigUpdate =
  createServerSessionController<'request-config-update'>(
    function (this, member, event) {
      // Build request for response data.
      let request = member.buildResponseRequestData(event)
      // Parse data from event.
      let { config: configUpdates } = event.data

      // If the member does not have the correct permissions
      // to start the session, then emit an error.
      if (!member.isAuthorized('configureSessions')) {
        return member.emitError(
          new ServerEmittedError(
            ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
            { request },
          ),
        )
      }
      // If the session is not in the 'unstarted' state,
      // then emit an error.
      if (this._state !== 'unstarted') {
        return member.emitError(
          new ServerEmittedError(
            ServerEmittedError.CODE_SESSION_CONFLICTING_STATE,
            { request },
          ),
        )
      }

      // Determine whether the session is transitioning into the
      // owner-only accessibility, in which case every member other
      // than the owner must be kicked.
      let becomingOwnerOnly =
        configUpdates.accessibility === 'owner-only' &&
        this._config.accessibility !== 'owner-only'

      // Assign the new configuration to the session.
      Object.assign(this._config, configUpdates)
      // Update the session name if it has changed.
      if (this.name !== configUpdates.name && configUpdates.name) {
        this.name = configUpdates.name
      }

      // Emit an event to all users that the session configuration
      // has been updated.
      this.emitToAll('session-config-updated', {
        data: { config: this.config },
        request,
      })

      // If the session became owner-only, kick every joined member
      // other than the owner.
      if (becomingOwnerOnly) {
        let membersToKick = this.joinedMembers.filter(
          (joinedMember) => joinedMember.userId !== this.ownerId,
        )

        for (let memberToKick of membersToKick) {
          memberToKick.emit('kicked', {
            data: {
              sessionId: this._id,
              memberId: memberToKick._id,
              userId: memberToKick.userId,
              reason:
                'The session has been changed to owner-only. Only the owner may remain.',
            },
            request,
          })
          memberToKick.leave()
        }

        // Emit an event to all remaining users that the member
        // list has changed.
        if (membersToKick.length) {
          this.emitToAll('session-members-updated', {
            data: {
              members: this.members.map((sessionMember) =>
                sessionMember.toJson(),
              ),
            },
          })
        }
      }
    },
  )
