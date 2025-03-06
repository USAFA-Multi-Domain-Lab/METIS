import { Request, Response } from 'express-serve-static-core'
import UserModel, { hashPassword } from 'metis/server/database/models/users'
import { StatusError } from 'metis/server/http'
import { databaseLogger } from 'metis/server/logging'
import ServerLogin from 'metis/server/logins'
import { TUserJson } from 'metis/users'
import ApiResponse from '../../library/response'

/**
 * This will reset the user's password.
 * @param request The express request.
 * @param response The express response.
 * @returns The updated user in JSON format.
 */
const resetPassword = async (request: Request, response: Response) => {
  // Extract the user updates from the request body.
  let userUpdates = request.body
  let { _id: userId } = userUpdates as Partial<TUserJson>
  // Get the user that is logged in.
  let login: ServerLogin | undefined = ServerLogin.get(request.session.userId)

  // Hash the password if it exists.
  if (!!userUpdates.password) {
    userUpdates.password = await hashPassword(userUpdates.password)
  }

  try {
    // Update the user.
    let userJson = await UserModel.findByIdAndUpdate(userId, userUpdates, {
      returnOriginal: false,
      runValidators: true,
    })
      .setOptions({ currentUser: login?.user, method: 'findOneAndUpdate' })
      .exec()
    // If the user was not found, throw an error.
    if (userJson === null) {
      throw new StatusError(`User with ID "${userId}" not found.`, 404)
    }
    // Log the successful update of the user.
    databaseLogger.info(`User with ID "${userId}" updated.`)
    // Return the updated user.
    return ApiResponse.sendStatus(response, 200)
  } catch (error: any) {
    // Log the error.
    databaseLogger.error(
      `Failed to reset the password for the user with ID "${userId}".\n`,
      error,
    )
    // Handle the error.
    return ApiResponse.error(error, response)
  }
}

export default resetPassword
