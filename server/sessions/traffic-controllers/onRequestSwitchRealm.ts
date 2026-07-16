import { ServerEmittedError } from '@shared/connect/errors/ServerEmittedError'
import type { TServerRealmJsonOptions } from '../ServerSessionRealm'
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

      // Respond to the requester with the realm serialized under complete
      // visibility (guaranteed by the authorization check above), mirroring
      // the exposure branch used in `emitStartResponses`.
      let realmJsonOptions: TServerRealmJsonOptions = {
        forceExposure: { expose: 'all' },
        fileExposure: { expose: 'all' },
        sessionDataExposure: { expose: 'all' },
      }
      member.emit('realm-switched', {
        method: 'realm-switched',
        data: { subscribedRealm: realm.toJson(realmJsonOptions) },
        request: member.buildResponseRequestData(event, { fulfilled: true }),
      })

      // A switch changes realm member counts and this member's
      // subscribedRealmId, so notify everyone to keep their member lists
      // (and derived realm counts) fresh.
      this.emitMembersUpdated()
    },
  )
