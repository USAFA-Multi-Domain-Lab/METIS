import type { Request, Response } from 'express-serve-static-core'
import { ServerEmittedError } from 'metis/connect'
import { databaseLogger } from '../../../../logging'
import { ServerLogin, ServerWebSession } from '../../../../logins'
import { SessionServer } from '../../../../sessions'
import { ApiResponse, StatusError } from '../../library'

/**
 * This will log the user out.
 * @param request The express request.
 * @param response The express response.
 * @returns 200 response if the user was logged out successfully.
 */
const logout = async (request: Request, response: Response) => {
  try {
    let forceful: boolean = request.headers.forceful === 'true'
    // Grab the current login info from the session.
    const { userId } = request.session
    const login = ServerLogin.get(userId)

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

    // Destroy the login, session, and quit the METIS session.
    if (login.metisSessionId) {
      SessionServer.quit(login.metisSessionId, login.userId)
    }

    // Destroy the login
    ServerLogin.destroy(login.userId)

    // Destroy the session in the store
    await ServerWebSession.destroy(login.webSessionId)

    // Send response
    return ApiResponse.sendStatus(response, 200)
  } catch (error: any) {
    databaseLogger.error('Failed to log out user.\n', error)
    return ApiResponse.error(error, response)
  }
}

export default logout
