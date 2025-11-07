import { UserModel } from '@server/database/models/users'
import { databaseLogger } from '../../../../logging'
import { ApiResponse } from '../../library/ApiResponse'
import { StatusError } from '../../library/StatusError'

/**
 * This will retrieve a specific user.
 * @param request The express request.
 * @param response The express response.
 * @returns The user in JSON format.
 */
export const getUser: TExpressHandler = async (request, response) => {
  // Extract the user ID from the request parameters.
  let { _id: userId } = request.params

  try {
    // Retrieve the user.
    let userDoc = await UserModel.findById(userId).exec()
    // If the user was not found, throw an error.
    if (userDoc === null) {
      throw new StatusError(`User with ID "${userId}" not found.`, 404)
    }
    // Log the successful retrieval of the user.
    databaseLogger.info(`User with ID "${userId}" retrieved.`)
    // Return the user.
    return ApiResponse.sendJson(response, userDoc)
  } catch (error: any) {
    // Log the error.
    databaseLogger.error(
      `Failed to retrieve user with ID "${userId}".\n`,
      error,
    )
    // Handle the error.
    return ApiResponse.error(error, response)
  }
}
