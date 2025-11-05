import type { Request, Response } from 'express-serve-static-core'
import type { TUserJson } from 'metis/users'
import { UserModel } from '../../../../database'
import { hashPassword } from '../../../../database/models/users'
import { databaseLogger } from '../../../../logging'
import type { ServerLogin } from '../../../../logins'
import { ApiResponse, StatusError } from '../../library'
import { preventSystemUserWrite } from '../../library/users'

/**
 * This will reset the user's password.
 * @param request The express request.
 * @param response The express response.
 * @returns The updated user in JSON format.
 */
const resetPassword = async (request: Request, response: Response) => {
  // Extract the user updates from the request body.
  let userUpdates = request.body
  let { password } = userUpdates as Partial<TUserJson>
  // Get the user that is logged in.
  let login: ServerLogin = response.locals.login

  // Hash the password if it exists.
  if (!!password) password = await hashPassword(password)

  try {
    // Disable system-user write operations.
    preventSystemUserWrite({ currentUserId: login.userId })

    // Update the user.
    let userJson = await UserModel.findByIdAndUpdate(
      login.userId,
      { password, needsPasswordReset: false },
      {
        returnOriginal: false,
        runValidators: true,
      },
    ).exec()
    // If the user was not found, throw an error.
    if (userJson === null) {
      throw new StatusError(`User with ID "${login.userId}" not found.`, 404)
    }
    // Log the successful update of the user.
    databaseLogger.info(`User with ID "${login.userId}" updated.`)
    // Update user in the login, marking it as no
    // longer needing a password reset.
    login.user.needsPasswordReset = userJson.needsPasswordReset
    // Return the updated user.
    return ApiResponse.sendStatus(response, 200)
  } catch (error: any) {
    // Log the error.
    databaseLogger.error(
      `Failed to reset the password for the user with ID "${login.userId}".\n`,
      error,
    )
    // Handle the error.
    return ApiResponse.error(error, response)
  }
}

export default resetPassword
