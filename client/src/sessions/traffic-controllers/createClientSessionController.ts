import type { TMetisClientComponents } from '@client/index'
import type { TServerEvents, TServerMethod } from '@shared/connect'
import {
  createSessionTrafficController,
  type TSessionTrafficControllerHandler,
} from '@shared/sessions/createSessionTrafficController'

/**
 * Creates a session controller via {@link createSessionTrafficController}
 * for use on the client.
 * @param handler Inner logic for processing incoming WS events, wrapped
 * by the function returned.
 * @returns A new handler function which can be used to process
 * incoming WS events for the client's member and event method.
 * @note `this` will be bound to the session for access to protected
 * session methods and properties.
 * @example
 * ```ts
 * export const onConfigUpdate =
 *   createClientSessionController<'session-config-updated'>(
 *     function (this, member, event) {
 *       this._config = event.data.config
 *     },
 *   )
 * ```
 */
export const createClientSessionController = <
  TEventMethod extends TServerMethod,
>(
  handler: TSessionTrafficControllerHandler<
    TMetisClientComponents,
    TServerEvents[TEventMethod]
  >,
) => {
  return createSessionTrafficController<
    TMetisClientComponents,
    TServerEvents[TEventMethod]
  >(handler)
}
