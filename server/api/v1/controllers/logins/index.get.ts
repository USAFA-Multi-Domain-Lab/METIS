import { ServerLogin } from '@server/logins/ServerLogin'
import { ApiResponse } from '../../library/ApiResponse'
/**
 * This will return the login information for the user making the request.
 * @param request The express request.
 * @param response The express response.
 * @returns The login information in JSON format or null if the login information was not found.
 */
export const getLogin: TExpressHandler = (request, response) => {
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
