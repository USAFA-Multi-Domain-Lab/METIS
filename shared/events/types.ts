/**
 * Interface for making a class compatible with the `useEventListener`
 * hook.
 */
export interface TListenerTarget<
  TEventMethod extends string,
  TCallbackArgs extends Array<any> = [],
> {
  /**
   * Adds an event listener to the target.
   * @param method The method of the event to listen for.
   * @param callback The callback for when the event is fired.
   * @returns The target with the event listener added.
   *
   */
  addEventListener: (
    method: TEventMethod,
    callback: (...args: TCallbackArgs) => any,
  ) => void
  /**
   * Removes an event listener from the target.
   * @param method The method of the event to listen for.
   * @param callback The callback of the listener to remove.
   * @returns The target with the event listener remove.
   */
  removeEventListener: (
    method: TEventMethod,
    callback: (...args: TCallbackArgs) => any,
  ) => void
}

/**
 * Advanced listener-target, with a method used to emit events.
 */
export interface TListenerTargetEmittable<
  TEventMethod extends string,
  TCallbackArgs extends Array<any> = [],
> extends TListenerTarget<TEventMethod, TCallbackArgs> {
  /**
   * Emits an event to the target.
   * @param method The method of the event to emit.
   * @param args The arguments to pass to the event.
   */
  emitEvent: (method: TEventMethod, ...args: TCallbackArgs) => void
}
