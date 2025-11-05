import type { Request, Response } from 'express-serve-static-core'
import { UserModel } from '../../../../database'
import { databaseLogger } from '../../../../logging'
import { ApiResponse, StatusError } from '../../library'
import { preventSystemUserWrite } from '../../library/users'

/**
 * This will delete a user.
 * @param request The express request.
 * @param response The express response.
 * @returns 200 response if the user was deleted successfully.
 */
const deleteUser = async (request: Request, response: Response) => {
  // Extract the user ID from the request parameters.
  let { _id: userId } = request.params

  try {
    // Disable system-user write operations.
    preventSystemUserWrite({ currentUserId: userId })

    // Delete the user.
    let deletedUserDoc = await UserModel.findByIdAndUpdate(
      userId,
      { deleted: true },
      { returnOriginal: false, runValidators: true },
    ).exec()
    // If the user was not found, throw an error.
    if (deletedUserDoc === null) {
      throw new StatusError(`User with ID "${userId}" not found.`, 404)
    }
    // Log the successful deletion of the user.
    databaseLogger.info(`Deleted user with the ID "${userId}".`)
    // Return a 200 status code.
    return ApiResponse.sendStatus(response, 200)
  } catch (error: any) {
    // Log the error.
    databaseLogger.error(
      `Failed to delete user with the ID "${userId}".\n`,
      error,
    )
    // Handle the error.
    return ApiResponse.error(error, response)
  }
}

export default deleteUser
