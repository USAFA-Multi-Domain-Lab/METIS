import { ServerLogin } from '@metis/server/logins/ServerLogin'
import type { ServerUser } from '@metis/server/users/ServerUser'

/**
 * Test-only subclass of `ServerLogin` that exposes timeout setters and
 * registry access. This allows integration tests to manipulate timeouts
 * without needing an Express request or Socket.
 * @note This class should ONLY be used in tests.
 */
export class TestServerLogin extends ServerLogin {
  /**
   * Sets a timeout for the user with the given user ID.
   * @param userId The ID of the user to set the timeout for.
   * @param timeoutEnd When the timeout ends.
   */
  public static timeoutByUserId(
    userId: ServerUser['_id'],
    timeoutEnd: number,
  ): void {
    // Always record the timeout in the userId registry so it persists
    // across logout/login cycles.
    TestServerLogin.timeoutRegistryByUserId.set(userId, timeoutEnd)

    // Also update the login instance if one is currently active.
    let login = ServerLogin.getByUserId(userId)
    login?.timeout(timeoutEnd)
  }

  /**
   * @param userId The user ID to look up.
   * @returns The timeout end time for the user, or null if not in timeout.
   */
  public static getTimeoutEndByUserId(
    userId: ServerUser['_id'],
  ): number | null {
    return TestServerLogin.timeoutRegistryByUserId.get(userId) ?? null
  }

  /**
   * Destroys the login associated with the given user ID.
   * @param userId The ID of the user to log out.
   */
  public static destroyByUserId(userId: ServerUser['_id']): void {
    let login = ServerLogin.getByUserId(userId)
    login?.destroy()
  }
}
