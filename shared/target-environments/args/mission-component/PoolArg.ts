/**
 * The pool argument type for a target.
 */
export class PoolArg {
  /**
   * The key used in the effect's arguments to reference the force's local key.
   */
  public static readonly FORCE_KEY = 'forceKey'

  /**
   * The key used in the effect's arguments to reference the force's name.
   */
  public static readonly FORCE_NAME = 'forceName'

  /**
   * The key used in the effect's arguments to reference the pool's local key.
   */
  public static readonly POOL_KEY = 'poolKey'

  /**
   * The key used in the effect's arguments to reference the pool's name.
   */
  public static readonly POOL_NAME = 'poolName'
}
