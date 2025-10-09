import type { Store } from 'express-session'
import { expressLogger } from 'metis/server/logging'

/**
 * This class helps manage (express) web sessions for logged in users.
 * Provides a static interface to mirror and manage the Express session store.
 */
export default class ServerWebSession {
  /**
   * Reference to the Express session store instance.
   * Set once during server initialization.
   */
  private static _store: Store | null = null

  /**
   * Map of session ID to user ID for quick lookups.
   * Mirrors the session store but only tracks logged-in users.
   */
  private static _sessionUserMap: Map<string, string> = new Map()

  /**
   * Map of user ID to session ID for reverse lookups.
   * Allows finding a user's session without iterating.
   */
  private static _userSessionMap: Map<string, string> = new Map()

  /**
   * Gets the Express session store instance.
   */
  public static get store(): Store {
    if (!this._store) {
      throw new Error(
        'Session store not initialized. Call ServerWebSession.initialize() first.',
      )
    }
    return this._store
  }

  /**
   * Creates the session store for the `ServerWebSession`.
   * @param store The Express session store instance.
   * @note This should only be called once on server startup.
   */
  public static createSessionStore(store: Store): void {
    this._store = store
  }

  /**
   * Registers a user login with their session ID.
   * @param sessionId The Express session ID.
   * @param userId The user ID associated with the session.
   */
  public static registerLogin(sessionId: string, userId: string): void {
    // Remove any existing session for this user (handles multiple logins)
    const existingSessionId = this._userSessionMap.get(userId)
    if (existingSessionId) {
      this._sessionUserMap.delete(existingSessionId)
    }

    // Register the new session
    this._sessionUserMap.set(sessionId, userId)
    this._userSessionMap.set(userId, sessionId)
  }

  /**
   * Unregisters a user login by session ID.
   * @param sessionId The Express session ID to unregister.
   */
  public static unregisterLoginBySession(sessionId: string): void {
    const userId = this._sessionUserMap.get(sessionId)
    if (userId) {
      this._sessionUserMap.delete(sessionId)
      this._userSessionMap.delete(userId)
    }
  }

  /**
   * Unregisters a user login by user ID.
   * @param userId The user ID to unregister.
   */
  public static unregisterLoginByUser(userId: string): void {
    const sessionId = this._userSessionMap.get(userId)
    if (sessionId) {
      this._sessionUserMap.delete(sessionId)
      this._userSessionMap.delete(userId)
    }
  }

  /**
   * Gets the user ID associated with a session ID.
   * @param sessionId The Express session ID.
   * @returns The user ID or undefined if not found.
   */
  public static getUserId(sessionId: string): string | undefined {
    return this._sessionUserMap.get(sessionId)
  }

  /**
   * Gets the session ID associated with a user ID.
   * @param userId The user ID.
   * @returns The session ID or undefined if not found.
   */
  public static getSessionId(userId: string): string | undefined {
    return this._userSessionMap.get(userId)
  }

  /**
   * Destroys a session by session ID.
   * @param sessionId The Express session ID to destroy.
   */
  public static destroy(sessionId: string): Promise<void> {
    return new Promise((resolve) => {
      try {
        this.store.destroy(sessionId, (error) => {
          // Always clean up our tracking first
          this.unregisterLoginBySession(sessionId)

          if (error) {
            // Log but don't fail - session cleanup should be resilient
            expressLogger.warn(
              'Session store destroy warning:',
              error.message || error,
            )
          }

          // Always resolve - session destruction should not break application flow
          resolve()
        })
      } catch (syncError) {
        // Handle synchronous errors
        expressLogger.warn('Session destroy sync error:', syncError)
        this.unregisterLoginBySession(sessionId)
        resolve()
      }
    })
  }

  /**
   * Destroys a session by user ID.
   * @param userId The user ID whose session should be destroyed.
   */
  public static async destroySessionByUser(userId: string): Promise<void> {
    const sessionId = this.getSessionId(userId)
    if (sessionId) await this.destroy(sessionId)
  }

  /**
   * Gets all currently tracked session IDs.
   * @returns Array of session IDs for logged-in users.
   */
  public static getAllSessionIds(): string[] {
    return Array.from(this._sessionUserMap.keys())
  }

  /**
   * Gets all currently tracked user IDs.
   * @returns Array of user IDs with active sessions.
   */
  public static getAllUserIds(): string[] {
    return Array.from(this._userSessionMap.keys())
  }

  /**
   * Checks if a user has an active session.
   * @param userId The user ID to check.
   * @returns True if the user has an active session.
   */
  public static hasActiveSession(userId: string): boolean {
    return this._userSessionMap.has(userId)
  }

  /**
   * Gets the total number of active sessions.
   * @returns The count of active sessions.
   */
  public static getActiveSessionCount(): number {
    return this._sessionUserMap.size
  }

  /**
   * Clears all session tracking (for testing/cleanup).
   * Does not destroy actual sessions in the store.
   */
  public static clearTracking(): void {
    this._sessionUserMap.clear()
    this._userSessionMap.clear()
  }
}
