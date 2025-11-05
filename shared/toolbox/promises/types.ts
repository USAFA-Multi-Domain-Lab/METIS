import type { User } from '../../users'

/**
 * Options for `PromiseManager` constructor.
 */
export interface TPromiseManagerOptions {
  /**
   * A user object that will allow for promises to
   * be added conditionally based on this user's
   * authorization.
   * @see `PromiseManager.authorize` method.
   * @default null
   */
  authUser?: User | null
}
