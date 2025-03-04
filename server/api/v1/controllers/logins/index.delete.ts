import { Request, Response } from 'express-serve-static-core'
import { databaseLogger } from 'metis/server/logging'
import ServerLogin from 'metis/server/logins'
import ApiResponse from '../../library/response'

/**
 * This will log the user out.
 * @param request The express request.
 * @param response The express response.
 * @returns 200 response if the user was logged out successfully.
 */
const logout = async (request: Request, response: Response) => {
  try {
    await ServerLogin.destroy(request.session)
    return ApiResponse.sendStatus(response, 200)
  } catch (error: any) {
    databaseLogger.error('Failed to log out user.\n', error)
    return ApiResponse.error(error, response)
  }
}

export default logout
