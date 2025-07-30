import { useEffect } from 'react'
import ClientUser from 'src/users'
import { TLogin } from '../../../../shared/logins'
import User from '../../../../shared/users'

/**
 * Options for `useResizeObserver` hook.
 */
export type TResizeObserverOptions = {}

/**
 * Options for the `useObjectFormSync` hook.
 */
export type TObjectFormSyncOptions<T extends {}> = {
  /**
   * Callback to call when the state updates for
   * one of the stateful properties in the object.
   * @default () => {}
   */
  onChange?: (prevState: T) => void
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

/**
 * The type used for `TDefaultProps` in the `useDefaultProps`
 * hook.
 */
export type TDefaultProps<TProps extends {}> = Required<{
  [K in keyof TProps as undefined extends TProps[K] ? K : never]: TProps[K]
}>
