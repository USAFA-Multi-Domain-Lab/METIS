import { NextFunction, Request, Response } from 'express-serve-static-core'
import ServerLogin from 'metis/server/logins'
import SessionServer from 'metis/server/sessions'
import ApiResponse from '../../library/response'

/**
 * This will log the user out.
 * @param request The express request.
 * @param response The express response.
 * @returns 200 response if the user was logged out successfully.
 */
const logout = (request: Request, response: Response, next: NextFunction) => {
  // If the express session exists.
  if (request.session) {
    // Get the login information.
    let login: ServerLogin | undefined = ServerLogin.get(request.session.userId)

    // If the logged in user is in a session,
    // then remove them from the session.
    if (login && login.sessionId && login.inSession) {
      // Get the session.
      let session = SessionServer.get(login.sessionId)
      // Remove the user from the session.
      session?.quit(login.userId)
    }

    // Log the user out by destroying the login.
    ServerLogin.destroy(request.session.userId)

    // Then destroy the Express session.
    request.session.destroy((error) => {
      if (error) {
        return next(error)
      }
      return ApiResponse.sendStatus(response, 200)
    })
  }
}

export default logout
