import { useEffect } from 'react'
import User from '../../../../shared/users'

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

/**
 * Options for `useResizeObserver` hook.
 */
export type TResizeObserverOptions = {}

/**
 * Options for the `useObjectFormSync` hook.
 */
export type TObjectFormSyncOptions = {
  /**
   * Callback to call when the state updates for
   * one of the stateful properties in the object.
   * @default () => {}
   */
  onChange?: () => void
}

/**
 * The callback for the useEffect hook.
 */
export type EffectsCallback = Parameters<typeof useEffect>[0]
/**
 * The return type for the useEffect hook callback.
 */
export type EffectsCallbackReturned = ReturnType<EffectsCallback>

/**
 * The return type for the `useRequireLogin` hook.
 */
export type TRequireLoginReturn = {
  /**
   * The login for the current web session.
   */
  login: NonNullable<TLogin<ClientUser>>
  /**
   * The current user for the web session.
   * @note This is the same as `login.user`
   */
  user: ClientUser
  /**
   * @inheritdoc User.isAuthorized
   * @note This is the same as `login.user.isAuthorized`
   */
  isAuthorized: User['isAuthorized']
  /**
   * @inheritdoc User.authorize
   * @note This is the same as `login.user.authorize`
   */
  authorize: User['authorize']
}
