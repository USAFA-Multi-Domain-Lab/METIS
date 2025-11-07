import { UserModel } from '@server/database/models/users'
import { databaseLogger } from '@server/logging'
import { ServerLogin } from '@server/logins/ServerLogin'
import { ServerUser } from '@server/users/ServerUser'
import { ApiResponse } from '../../library/ApiResponse'
import { StatusError } from '../../library/StatusError'

/**
 * This will retrieve all users.
 * @param request The express request.
 * @param response The express response.
 * @returns The users in JSON format.
 */
export const getUsers: TExpressHandler = async (request, response) => {
  // Get the user that is logged in.
  let login: ServerLogin | undefined = ServerLogin.get(request.session.userId)
  if (!login) throw new StatusError('User is not logged in.', 401)
  let { user: currentUser } = login
  // Determine what type of users the current user can access from
  // the database.
  const userAccessType = ServerUser.canAccess(currentUser, 'read')

  try {
    // Retrieve all users.
    let users = await UserModel.find({ accessId: userAccessType }).exec()
    // If no users were found, throw an error.
    if (users === null || users.length === 0) {
      throw new StatusError('No users found.', 404)
    }
    // Ensure that the current user is allowed to access all the users
    // that were retrieved.
    for (let user of users) {
      if (!userAccessType.includes(user.accessId)) {
        throw new StatusError(
          `User with ID "${user._id}" cannot be accessed by the current user with ID "${currentUser._id}".`,
          403,
        )
      }
    }
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
