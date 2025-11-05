import type { Request, Response } from 'express-serve-static-core'
import { UserModel } from '../../../../database'
import { expressLogger } from '../../../../logging'
import { ServerLogin } from '../../../../logins'
import { ServerUser } from '../../../../users'
import { ApiResponse, StatusError } from '../../library'
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
    let user = ServerUser.fromExistingJson(userJson)

    try {
      // Attempt to create a new login object.
      let login = new ServerLogin(user, request.sessionID, { forceful })
      // If the login is in a timeout, throw an error.
      if (login.inTimeout) {
        throw new StatusError(
          'The account has timed out likely due to too many requests being made. Please try again later.',
          403,
        )
      }
      // Store the logged in user's ID in the express session.
      request.session.userId = login.userId
      // Store the login data in the response json.
      return ApiResponse.sendJson(response, { login: login.toJson() })
    } catch (error: any) {
      // Throw the 403 error one level up.
      if (error.status === 403) throw error
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
