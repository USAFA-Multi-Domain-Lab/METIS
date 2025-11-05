import type { TListenerTargetEmittable } from './types'

/**
 * Manages event listeners for an implementation of `TListenerTargetEmittable`.
 * @example
 * ```ts
 * // Setup
 *
 * export type TMissionEvent = 'activity' | 'selection' | 'execute'
 *
 * export class Mission implements TListenerTargetEmittable<TMissionEvent, []> {
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
  TCallbackArgs extends Array<any> = [],
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
   * @see {@link TListenerTargetEmittable.addEventListener}
   */
  public addEventListener: TTarget['addEventListener'] = (method, callback) => {
    this.listeners.push([method, callback])
  }

  /**
   * @see {@link TListenerTargetEmittable.removeEventListener}
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
