import { StoreState } from './StoreState'

/**
 * Allows data to be cached for specific to a target environment
 * and to a realm. Essentially, this will allow target environment
 * scripts to cache data between the execution of scripts during a
 * session, while preventing other sessions, realms, or target
 * environments from accessing that data.
 * @note How far the data reaches is decided by the key it is stored
 * under. A store can belong to one target environment within one realm,
 * to every environment within one realm, or to the session instance as
 * a whole.
 */
export class TargetEnvStore {
  /**
   * The internal store.
   */
  private store: Map<string, StoreState<any>> = new Map()

  /**
   * Similar to `get`, this will retrieve the given value
   * for the given key. However, if the key does not exist,
   * it will first be set to the default value provided.
   * @param key The store key to access.
   * @param defaultValue The value to use if the key does not exist.
   * @returns The value associated with the key.
   */
  public use<T extends any>(key: string, defaultValue: T): StoreState<T> {
    if (!this.store.has(key)) {
      this.store.set(key, new StoreState(defaultValue))
    }
    return this.store.get(key) as StoreState<T>
  }

  /**
   * Removes all entries from the cache.
   */
  private clear(): void {
    this.store.clear()
  }

  /**
   * Registry of all TargetEnvStore instances, keyed by session, realm,
   * and target environment.
   */
  private static registry: Map<string, TargetEnvStore> = new Map()

  /**
   * Generates a unique key for a realm and target environment pair.
   * @param sessionId The session identifier.
   * @param sessionInstanceId The session instance identifier.
   * @param realmId The realm identifier. If not provided, a key spanning
   * every realm in the session instance is generated.
   * @param targetEnvId The target environment identifier. If not provided,
   * a global store key is generated. This will be a key specific to the
   * realm, but not to any particular target environment.
   * @returns The generated unique store key.
   * @note The session ID leads the key so that {@link cleanUp} can sweep
   * every store belonging to a session by prefix, and because a realm ID
   * is not unique on its own: every session's default realm shares the
   * same constant identifier.
   */
  private static generateKey(
    sessionId: string,
    sessionInstanceId: string,
    realmId: string = '<global>',
    targetEnvId: string = '<global>',
  ): string {
    return `${sessionId}::${sessionInstanceId}::${realmId}::${targetEnvId}`
  }

  /**
   * Retrieves the store for a given realm and target environment.
   * If it does not exist, a new store is created.
   * @param sessionId The session identifier.
   * @param sessionInstanceId The session instance identifier.
   * @param realmId The realm identifier. If not provided, a store shared
   * by every realm in the session instance is returned.
   * @param targetEnvId The target environment identifier. If not provided,
   * a global, non-environment-specific store is returned. This store will
   * still be specific to the realm.
   * @returns The store Map for the realm/targetEnv pair.
   */
  public static get(
    sessionId: string,
    sessionInstanceId: string,
    realmId: string = '<global>',
    targetEnvId: string = '<global>',
  ): TargetEnvStore {
    const key = this.generateKey(
      sessionId,
      sessionInstanceId,
      realmId,
      targetEnvId,
    )
    if (!this.registry.has(key)) {
      this.registry.set(key, new TargetEnvStore())
    }
    return this.registry.get(key)!
  }

  /**
   * Removes the store for a given realm and target environment from
   * the registry.
   * @param sessionId The session identifier.
   * @param sessionInstanceId The session instance identifier.
   * @param realmId The realm identifier. If not provided, the store
   * shared by every realm in the session instance is cleared.
   * @param targetEnvId The target environment identifier. If not provided,
   * a global store for the realm is cleared.
   */
  public static deregister(
    sessionId: string,
    sessionInstanceId: string,
    realmId: string = '<global>',
    targetEnvId: string = '<global>',
  ): void {
    const key = this.generateKey(
      sessionId,
      sessionInstanceId,
      realmId,
      targetEnvId,
    )
    this.registry.delete(key)
  }

  /**
   * Cleans up all stores associated with a given session.
   * @param sessionId The session identifier.
   */
  public static cleanUp(sessionId: string): void {
    for (const key of this.registry.keys()) {
      if (key.startsWith(`${sessionId}::`)) {
        this.registry.get(key)?.clear()
        this.registry.delete(key)
      }
    }
  }
}
