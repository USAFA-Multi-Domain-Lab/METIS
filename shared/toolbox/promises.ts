import User from 'metis/users'
import { TUserPermissionId } from 'metis/users/permissions'

/**
 * A static utility class for working with promises.
 * @note This class is a placeholder for now and does
 * not currently contain any methods.
 */
export default class PromiseToolbox {}

/**
 * Manages multiple promises at once in an efficient way.
 */
export class PromiseManager<T = any> {
  /**
   * Privately maintained cache for the promises.
   */
  private _promises: Promise<T>[]
  /**
   * The promises that are currently being managed.
   */
  public get promises(): Promise<T>[] {
    return [...this._promises]
  }

  /**
   * A user object that will allow for promises to
   * be added conditionally based on this user's
   * authorization.
   */
  private authUser: User | null = null

  /**
   * @param promises Initial promises to account for, more
   * can be added later via the `add` method.`
   */
  public constructor(
    promises: Promise<T>[] = [],
    options: TPromiseManagerOptions = {},
  ) {
    const { authUser = null } = options
    this._promises = promises
    this.authUser = authUser
  }

  /**
   * Adds a promise to the manager.
   * @param promises The promises to add.
   */
  public add(...promises: Promise<T>[]): void {
    this._promises.push(...promises)
  }

  /**
   * Executes the provided operation, adding the returned
   * promise of the operation to the manager, but only
   * if the user is authorized to do so.
   * @param permissions The permissions the user must have
   * to add the promises.
   * @param operation A callback that will return
   * a promise which will then be added to the manager.
   * @returns True if the user was authorized, false otherwise.
   * @note This method will always authorize the operation if
   * no user is provided in the constructor.
   */
  public authorize(
    permissions: TUserPermissionId[],
    operation: () => Promise<T>,
  ): boolean {
    const authorized = !this.authUser || this.authUser.isAuthorized(permissions)
    if (authorized) this.add(operation())
    return authorized
  }

  /**
   * @resolves When all current promises in the manager
   * have been resolved, without any rejections.
   * @rejects When one of the promises in the manager
   * has been rejected.
   * @note All this does is take the current promises
   * and pass them to `Promise.all()`.
   */
  public async all(): Promise<T[]> {
    return Promise.all(this._promises)
  }
}

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
