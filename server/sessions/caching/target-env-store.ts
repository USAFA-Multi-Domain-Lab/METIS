import StoreState from './store-state'

/**
 * Allows data to be cached for specific to a target environment
 * and to a session. Essentially, this will allow target environment
 * scripts to cache data between the execution of scripts during a
 * session, while preventing other sessions or target environments
 * from accessing that data.
 */
export default class TargetEnvStore {
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
  public use<T = any>(key: string, defaultValue: any): StoreState<T> {
    if (!this.store.has(key)) {
      this.store.set(key, new StoreState(defaultValue))
    }
    return this.store.get(key) as StoreState<T>
  }

  /**
   * Checks if a key exists in the store.
   * @param key The store key to check.
   * @returns True if the key exists, false otherwise.
   */
  public has(key: string): boolean {
    return this.store.has(key)
  }

  /**
   * Deletes a key and its value from the store.
   * @param key The store key to delete.
   * @returns True if the key existed and was deleted, false otherwise.
   */
  public delete(key: string): boolean {
    return this.store.delete(key)
  }

  /**
   * Removes all entries from the cache.
   */
  public clear(): void {
    this.store.clear()
  }

  /**
   * Returns an iterator of all keys in the store.
   * @returns An iterator for the store's keys.
   */
  public keys(): IterableIterator<string> {
    return this.store.keys()
  }

  /**
   * Registry of all TargetEnvStore instances, keyed by session and target environment.
   */
  private static registry: Map<string, TargetEnvStore> = new Map()

  /**
   * Generates a unique key for a session and target environment pair.
   * @param sessionId The session identifier.
   * @param targetEnvId The target environment identifier. If not provided,
   * a global store key is generated. This will be a key specific to the
   * session, but not to any particular target environment.
   * @returns The generated unique store key.
   */
  private static generateKey(
    sessionId: string,
    targetEnvId: string = '<global>',
  ): string {
    return `${sessionId}::${targetEnvId}`
  }

  /**
   * Retrieves the store for a given session and target environment.
   * If it does not exist, a new store is created.
   * @param sessionId The session identifier.
   * @param targetEnvId The target environment identifier. If not provided,
   * a global, non-environment-specific store is returned. This store will
   * still be specific to the session.
   * @returns The store Map for the session/targetEnv pair.
   */
  public static getStore(
    sessionId: string,
    targetEnvId: string = '<global>',
  ): TargetEnvStore {
    const key = this.generateKey(sessionId, targetEnvId)
    if (!this.registry.has(key)) {
      this.registry.set(key, new TargetEnvStore())
    }
    return this.registry.get(key)!
  }

  /**
   * Removes and clears the store for a given session and target environment.
   * @param sessionId The session identifier.
   * @param targetEnvId The target environment identifier. If not provided,
   * a global store for the session is cleared.
   */
  public static destroyStore(
    sessionId: string,
    targetEnvId: string = '<global>',
  ): void {
    const key = this.generateKey(sessionId, targetEnvId)
    const storeInstance = this.registry.get(key)
    if (storeInstance) {
      storeInstance.clear()
    }
    this.registry.delete(key)
  }
}
