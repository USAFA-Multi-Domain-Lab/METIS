import type { TClientEvents, TClientMethod } from '@shared/connect'
import {
  createSessionTrafficController,
  type TSessionTrafficControllerHandler,
} from '@shared/sessions/createSessionTrafficController'

/**
 * Creates a session controller via {@link createSessionTrafficController}
 * for use on the server.
 * @param handler Inner logic for processing incoming WS events, wrapped
 * by the function returned.
 * @returns A new handler function which can be used to process
 * incoming WS events for a given session member and event method.
 * @note `this` will be bound to the session for access to protected
 * session methods and properties.
 * @example
 * ```ts
 * export const onAcknowledgeSessionPanelAlert =
 *   createServerSessionController<'acknowledge-session-panel-alert'>(
 *     function (this, member, event) {
 *       if (event.data.panel === 'Messenger') {
 *         this.clearUnreadChatCount(member._id, event.data.channelId)
 *
 *         if (!this.hasPendingUnreadChatMessages(member._id)) {
 *           this.clearSessionPanelAlert(member, 'Messenger')
 *         }
 *       } else {
 *         this.clearSessionPanelAlert(member, event.data.panel)
 *       }
 *     },
 *   )
 * ```
 */
export const createServerSessionController = <
  TEventMethod extends TClientMethod,
>(
  handler: TSessionTrafficControllerHandler<
    TMetisServerComponents,
    TClientEvents[TEventMethod]
  >,
) => {
  return createSessionTrafficController<
    TMetisServerComponents,
    TClientEvents[TEventMethod]
  >(handler)
}
