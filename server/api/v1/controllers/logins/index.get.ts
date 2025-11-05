import type { Request, Response } from 'express-serve-static-core'
import { ServerLogin } from '../../../../logins'
import { ApiResponse } from '../../library'
/**
 * This will return the login information for the user making the request.
 * @param request The express request.
 * @param response The express response.
 * @returns The login information in JSON format or null if the login information was not found.
 */
const getLogin = (request: Request, response: Response) => {
  // Retrieve the login information with the user
  // ID stored in the request.
  let login: ServerLogin | undefined = ServerLogin.get(request.session.userId)

  // If the login information was not found, return
  // an empty object.
  if (login === undefined) {
    return response.json(null)
  }
  // Otherwise, convert and return the login information
  // as JSON.
  else {
    return ApiResponse.sendJson(response, login.toJson())
  }
}

export default getLogin
