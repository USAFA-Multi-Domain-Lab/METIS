import type { TUserDoc } from '@server/database/models/types'
import {
  UserModel,
  checkLoginLockout,
  recordFailedLoginAttempt,
  resetFailedLoginAttempts,
} from '@server/database/models/users'
import { ServerLogin } from '@server/logins/ServerLogin'
import type { MetisServer } from '@server/MetisServer'
import { asyncHandler } from '@server/middleware/async'
import type { ServerUser } from '@server/users/ServerUser'
import { ApiResponse } from '../../library/ApiResponse'
import { StatusError } from '../../library/StatusError'

/* -- ROUTE HANDLER -- */

/**
 * This will log the user in and create a new session.
 * Username and password are evaluated for authentication.
 * Max password attempts are enforced with lockout.
 * @resolves With the login information in JSON format.
 * @rejects Due to any authentication, lockout, timeout,
 * conflicting-client, or server errors.
 */
export const login: TExpressHandler = asyncHandler(
  async (request, response) => {
    let userDoc: TUserDoc, user: ServerUser, login: ServerLogin

    userDoc = await confirmUserExists(request.body.username)
    await enforceLockoutPolicy(userDoc)
    user = await authenticate(request, response, userDoc)
    await resetFailedLoginAttempts(user._id)
    login = await realizeLogin(request, user)

    return ApiResponse.sendJson(response, { login: login.toJson() })
  },
)

/* -- HELPER FUNCTIONS -- */

/**
 * Confirms that the user with the given username exists.
 * @param username The username of the user in question.
 * @resolves With the user document, if found.
 * @rejects If no user with the given username exists.
 */
async function confirmUserExists(username: string): Promise<TUserDoc> {
  let userDoc = await UserModel.findOne(
    { username },
    {},
    { includeSensitive: true },
  ).exec()

  if (!userDoc) {
    throw new StatusError('Incorrect username or password.', 401)
  }

  return userDoc
}

/**
 * Enforces the lockout policy for a user attempting to log in.
 * If the user is currently locked out, an error is thrown.
 * @resolves When the user is not locked out.
 * @rejects When the user is locked out.
 */
async function enforceLockoutPolicy(userDoc: TUserDoc) {
  let { isLocked, unlockTime } = await checkLoginLockout(userDoc._id)

  if (isLocked) {
    let minutesRemaining = Math.ceil(
      (unlockTime!.getTime() - Date.now()) / 60000,
    )
    throw new StatusError(
      `Account is locked due to too many failed login attempts. Please try again in ${minutesRemaining} minute(s).`,
      403,
    )
  }
}

/**
 * Authenticates the user in METIS, recording failed login attempts
 * if authentication fails.
 * @param request The Express request that initiated the authentication.
 * @param response The Express response associated with the request.
 * @param userDoc The user document of the user being authenticated.
 * @resolves With the authenticated user.
 * @rejects If authentication fails.
 */
async function authenticate(
  request: TExpressRequest,
  response: TExpressResponse,
  userDoc: TUserDoc,
): Promise<ServerUser> {
  try {
    return await UserModel.authenticate(request)
  } catch (authError: any) {
    // Authentication failed - record the attempt
    let metis: MetisServer = response.locals.metis
    await recordFailedLoginAttempt(
      userDoc._id,
      metis.maxLoginAttempts,
      metis.loginLockoutDuration,
      metis.loginAttemptWindow,
    )

    // Check if this failure caused a lockout
    let { isLocked: nowLocked, unlockTime: newUnlockTime } =
      await checkLoginLockout(userDoc._id)

    if (nowLocked) {
      let minutesRemaining = Math.ceil(
        (newUnlockTime!.getTime() - Date.now()) / 60000,
      )
      throw new StatusError(
        `Too many failed login attempts. Account locked for ${minutesRemaining} minute(s).`,
        403,
      )
    }

    // Re-throw the original authentication error.
    throw authError
  }
}

/**
 * Completes the login process for an authenticated user,
 * returning a `ServerLogin` instance.
 * @param request The express request.
 * @param user The authenticated user.
 * @resolves With the realized login.
 * @rejects Due to login timeouts.
 */
async function realizeLogin(
  request: TExpressRequest,
  user: ServerUser,
): Promise<ServerLogin> {
  let forceful: boolean = request.headers.forceful === 'true'
  let login = new ServerLogin(user, request.sessionID, { forceful })

  if (login.inTimeout) {
    throw new StatusError(
      `The account has timed out likely due to too many requests being made. Account timed out for ${login.timeoutMinutesRemaining} minute(s).`,
      403,
    )
  }

  request.session.userId = login.userId

  return login
}
