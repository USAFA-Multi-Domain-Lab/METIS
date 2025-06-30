import { Request, Response } from 'express-serve-static-core'
import UserModel from 'metis/server/database/models/users'
import { StatusError } from 'metis/server/http'
import { databaseLogger } from 'metis/server/logging'
import ServerLogin from 'metis/server/logins'
import ApiResponse from '../../library/response'

/**
 * This will retrieve all users.
 * @param request The express request.
 * @param response The express response.
 * @returns The users in JSON format.
 */
const getUsers = async (request: Request, response: Response) => {
  // Get the user that is logged in.
  let login: ServerLogin | undefined = ServerLogin.get(request.session.userId)
  let { user: currentUser } = login ?? {}

  try {
    // Retrieve all users.
    let users = await UserModel.find({ accessId: { $ne: 'system' } })
      .setOptions({ currentUser, method: 'find' })
      .exec()
    // If no users were found, throw an error.
    if (users === null) throw new StatusError('No users found.', 404)
    // Log the successful retrieval of all users.
    databaseLogger.info('All users retrieved.')
    // Return the users.
    return ApiResponse.sendJson(response, users)
  } catch (error: any) {
    // Log the error.
    databaseLogger.error('Failed to retrieve users.\n', error)
    // Handle the error.
    return ApiResponse.error(error, response)
  }
}

export default getUsers
