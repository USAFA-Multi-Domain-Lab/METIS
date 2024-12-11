import { Request, Response } from 'express-serve-static-core'
import UserModel from 'metis/server/database/models/users'
import { StatusError } from 'metis/server/http'
import { expressLogger } from 'metis/server/logging'
import ServerLogin from 'metis/server/logins'
import ServerUser from 'metis/server/users'
import ApiResponse from '../../library/response'
/**
 * This will log the user in.
 * @param request The express request.
 * @param response The express response.
 * @returns The login information in JSON format.
 */
const login = async (request: Request, response: Response) => {
  let forceful: boolean = request.headers.forceful === 'true'

  try {
    // Attempt to authenticate the user.
    let userJson = await UserModel.authenticate(request)
    // If the user was authenticated, create a new user object.
    let user = new ServerUser(userJson)

    try {
      // Attempt to create a new login object.
      let login = new ServerLogin(user, { forceful })
      // Store the logged in user's ID in the express session.
      request.session.userId = login.userId
      // Store the login data in the response json.
      return ApiResponse.sendJson(response, { login: login.toJson() })
    } catch (error: any) {
      // If the user is already logged in on another device
      // or browser, throw an error.
      throw new StatusError(
        'Account is already logged in on another device or browser.',
        409,
      )
    }
  } catch (error: any) {
    // Log the error.
    expressLogger.error('Failed to log in user.\n', error)
    // Handle the error.
    return ApiResponse.error(error, response)
  }
}

export default login
