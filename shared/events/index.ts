/**
 * Manages event listeners for an implementation of `TListenerTargetEmittable`.
 * @example
 * ```ts
 * // Setup
 *
 * export type TMissionEvent = 'activity' | 'selection' | 'execute'
 *
 * export default class Mission implements TListenerTargetEmittable<TMissionEvent, []> {
 *
 *   private eventManager: EventManager<TMissionEvent, []>
 *
 *   public constructor() {
 *     this.eventManager = new EventManager(this)
 *     this.addEventListener = this.eventManager.addEventListener
 *     this.removeEventListener = this.eventManager.removeEventListener
 *     this.emitEvent = this.eventManager.emitEvent
 *   }
 *
 *   // Implemented
 *   public addEventListener
 *
 *   // Implemented
 *   public removeEventListener
 *
 *   // Implemented
 *   public emitEvent
 *  }
 *
 * // Usage
 *
 * const mission = new Mission()
 *
 * mission.addEventListener('activity', () => {
 *   console.log('Activity occurred.')
 * })
 *
 * mission.emitEvent('activity')
 * ```
 */
export class EventManager<
  TMethod extends string,
  TCallbackArgs extends [],
  TTarget extends TListenerTargetEmittable<
    TMethod,
    TCallbackArgs
  > = TListenerTargetEmittable<TMethod, TCallbackArgs>,
> {
  /**
   * The event-listener target to manage.
   */
  public target: TTarget

  /**
   * The event listeners added to the target.
   */
  private listeners: [string, (...args: TCallbackArgs) => void][]

  /**
   * @param target The event-listener target to manage.
   */
  public constructor(target: TTarget) {
    this.target = target
    this.listeners = []
  }

  /**
   * @inheritdoc TListenerTargetEmittable.addEventListener
   */
  public addEventListener: TTarget['addEventListener'] = (method, callback) => {
    this.listeners.push([method, callback])
  }

  /**
   * @inheritdoc TListenerTargetEmittable.removeEventListener
   */
  public removeEventListener: TTarget['removeEventListener'] = (
    method,
    callback,
  ) => {
    // Filter out listener.
    this.listeners = this.listeners.filter(
      ([m, h]) => m !== method || h !== callback,
    )
  }

  /**
   * Emits an event for the target.
   * @param method The method of the event to emit.
   */
  public emitEvent: TTarget['emitEvent'] = (method, ...args) => {
    // Call any matching listener callbacks
    // or any activity listener callbacks.
    for (let [listenerEvent, listenerCallback] of this.listeners) {
      if (listenerEvent === method || listenerEvent === 'activity') {
        listenerCallback(...args)
      }
    }
  }
}
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
