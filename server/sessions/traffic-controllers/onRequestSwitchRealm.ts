import { ServerEmittedError } from '@shared/connect/errors/ServerEmittedError'
import { createServerSessionController } from './createServerSessionController'

/**
 * Called when a complete-visibility member requests to switch the realm
 * they are subscribed to.
 * @param member The member requesting to switch realms.
 * @param event The event emitted by the member.
 */
export const onRequestSwitchRealm =
  createServerSessionController<'request-switch-realm'>(
    function (this, member, event) {
      // Build request for response data.
      let request = member.buildResponseRequestData(event)
      let { realmId } = event.data

      // Only members with complete visibility may switch realms.
      if (!member.isAuthorized('completeVisibility')) {
        return member.emitError(
          new ServerEmittedError(
            ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
            { request },
          ),
        )
      }
      // Realms only exist once the session has started.
      if (this.state !== 'started') {
        return member.emitError(
          new ServerEmittedError(
            ServerEmittedError.CODE_SESSION_CONFLICTING_STATE,
            { request },
          ),
        )
      }

      // Find the requested realm.
      let realm = this.getRealm(realmId)
      if (realm === undefined) {
        return member.emitError(
          new ServerEmittedError(ServerEmittedError.CODE_REALM_NOT_FOUND, {
            request,
          }),
        )
      }

      // Subscribe the member to the requested realm for routing purposes.
      member.subscribeToRealm(realm)

      // Respond to the requester with the realm they now subscribe to,
      // serialized under their own exposure.
      member.emit('realm-switched', {
        method: 'realm-switched',
        data: { subscribedRealm: member.subscribedRealmJson },
        request: member.buildResponseRequestData(event, { fulfilled: true }),
      })

      // A switch changes realm member counts and this member's
      // subscribedRealmId, so notify everyone to keep their member lists
      // (and derived realm counts) fresh.
      this.emitMembersUpdated()
    },
  )
