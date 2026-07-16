import { createClientSessionController } from './createClientSessionController'

/**
 * Handles when the member has switched the realm they are subscribed to.
 * @param member The client's session member.
 * @param event The event emitted by the server.
 */
export const onRealmSwitched = createClientSessionController<'realm-switched'>(
  function (this, member, event) {
    this.importSwitchedRealmData(event)
  },
)
