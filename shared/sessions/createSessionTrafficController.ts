import type { TClientEvent, TServerEvent } from '@shared/connect'

/**
 * @param handler Inner logic for processing incoming WS events, wrapped
 * by the function returned.
 * @returns A new handler function which can be used to process
 * incoming WS events for a given session member and event method.
 * @note `this` will be bound to the session for access to protected
 * session methods and properties.
 */
export const createSessionTrafficController = <
  T extends TMetisBaseComponents,
  TEvent extends TClientEvent | TServerEvent,
>(
  handler: TSessionTrafficControllerHandler<T, TEvent>,
) => {
  return (member: T['member'], event: TEvent) => {
    return handler.call(member.session, member, event)
  }
}

/* -- TYPES -- */

/**
 * Utility type used to define the shape of the handler
 * function passed to `createSessionTrafficController`.
 */
export type TSessionTrafficControllerHandler<
  T extends TMetisBaseComponents,
  TEvent extends TClientEvent | TServerEvent,
> = (this: T['session'], member: T['member'], event: TEvent) => void
