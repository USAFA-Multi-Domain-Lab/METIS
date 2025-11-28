import { hashPassword, UserModel } from '@server/database/models/users'
import { databaseLogger } from '@server/logging'
import type { ServerLogin } from '@server/logins/ServerLogin'
import type { TUserJson } from '@shared/users/User'
import bcryptjs from 'bcryptjs'
import { ApiResponse } from '../../library/ApiResponse'
import { StatusError } from '../../library/StatusError'
import { preventSystemUserWrite } from '../../library/users'

/**
 * This will reset the user's password.
 * @param request The express request.
 * @param response The express response.
 * @returns The updated user in JSON format.
 */
export const resetPassword: TExpressHandler = async (request, response) => {
  // Extract the user updates from the request body.
  let userUpdates = request.body
  let { password } = userUpdates as TResetPasswordRequestBody
  // Get the user that is logged in.
  let login: ServerLogin = response.locals.login

  try {
    // Disable system-user write operations.
    preventSystemUserWrite({ currentUserId: login.userId })

    // Get the current user with their password
    let currentUser = await UserModel.findById(
      login.userId,
      {},
      { includeSensitive: true },
    ).exec()

    if (!currentUser) {
      throw new StatusError(`User with ID "${login.userId}" not found.`, 404)
    }

    // Check if the current user has a password
    if (currentUser.password) {
      // Compare the new password with the old password
      let isSamePassword = await bcryptjs.compare(
        password,
        currentUser.password,
      )

      if (isSamePassword) {
        throw new StatusError(
          'New password cannot be the same as the old password.',
          422,
        )
      }
    }

    // Hash the password
    let hashedPassword = await hashPassword(password)

    // Update the user.
    let userJson = await UserModel.findByIdAndUpdate(
      login.userId,
      { password: hashedPassword, needsPasswordReset: false },
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

/**
 * The request body for resetting a user's password.
 */
type TResetPasswordRequestBody = {
  /**
   * The new password for the user.
   */
  password: Required<TUserJson>['password']
}
