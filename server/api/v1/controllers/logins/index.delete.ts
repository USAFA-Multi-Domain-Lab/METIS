import { ServerLogin } from '@server/logins/ServerLogin'
import { ServerEmittedError } from '@shared/connect/errors/ServerEmittedError'
import { databaseLogger } from '../../../../logging'
import { ApiResponse } from '../../library/ApiResponse'

/**
 * This will log the user out.
 * @param request The express request.
 * @param response The express response.
 * @returns 200 response if the user was logged out successfully, including
 * when nobody was logged in to begin with.
 */
export const logout: TExpressHandler = async (request, response) => {
  try {
    let forceful: boolean = request.headers.forceful === 'true'
    const login = ServerLogin.get(request)

    // Nobody is logged in, so the caller already has what it asked for. This
    // happens when the login was ended elsewhere, such as when the account
    // was deleted while the user was signed in.
    if (!login) {
      return ApiResponse.sendStatus(response, 200)
    }

    // If the conflicting login has a client,
    // emit an error to that client that the
    // connection is switching.
    if (forceful && login.client) {
      login.client.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_FORCE_DISCONNECT_SELF),
      )
    }

    login.destroy()
    return ApiResponse.sendStatus(response, 200)
  } catch (error: any) {
    databaseLogger.error('Failed to log out user.\n', error)
    return ApiResponse.error(error, response)
  }
}
