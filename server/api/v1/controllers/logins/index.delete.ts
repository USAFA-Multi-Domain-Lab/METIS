import { ServerLogin } from '@server/logins/ServerLogin'
import { ServerEmittedError } from '@shared/connect/errors/ServerEmittedError'
import { databaseLogger } from '../../../../logging'
import { ApiResponse } from '../../library/ApiResponse'
import { StatusError } from '../../library/StatusError'

/**
 * This will log the user out.
 * @param request The express request.
 * @param response The express response.
 * @returns 200 response if the user was logged out successfully.
 */
export const logout: TExpressHandler = async (request, response) => {
  try {
    let forceful: boolean = request.headers.forceful === 'true'
    const login = ServerLogin.get(request)

    // If there is no login, throw an error.
    if (!login) {
      throw new StatusError('No user is currently logged in.', 400)
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
