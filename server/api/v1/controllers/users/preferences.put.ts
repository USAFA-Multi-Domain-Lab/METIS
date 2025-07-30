import { Request, Response } from 'express-serve-static-core'
import UserModel from 'metis/server/database/models/users'
import { StatusError } from 'metis/server/http'
import { databaseLogger } from 'metis/server/logging'
import ServerLogin from 'metis/server/logins'
import { TUserExistingJson } from 'metis/users'
import TUserPreferencesJson from 'metis/users/preferences'
import ApiResponse from '../../library/response'
import { preventSystemUserWrite } from '../../library/users'

/**
 * This will update the preferences of the
 * logged-in user.
 * @param request The express request.
 * @param response The express response.
 * @returns The express response to send to the client.
 */
const updateUserPreferences = async (request: Request, response: Response) => {
  // Extract the updates from the request body.
  let preferences: TUserPreferencesJson = request.body.preferences
  // Get the user that is logged in.
  let login: ServerLogin = response.locals.login

  try {
    // Disable system-user write operations.
    preventSystemUserWrite({ currentUserId: login.userId })

    // Update the user preferences.
    let userDoc: TUserExistingJson = await UserModel.findByIdAndModify(
      login.userId,
      {},
      {
        returnOriginal: false,
        runValidators: true,
      },
      { preferences },
    )
    // If the user was not found, throw an error.
    if (userDoc === null) {
      throw new StatusError(`User with ID "${login.userId}" not found.`, 404)
    }
    // Log the successful update of the preferences.
    databaseLogger.info(`User preferences with ID "${login.userId}" updated.`)
    // Update user in the login with the new
    // preferences.
    login.user.preferences = userDoc.preferences

    // Return the updated user preferences.
    return ApiResponse.sendJson<TUserPreferencesJson>(
      response,
      userDoc.preferences,
    )
  } catch (error: any) {
    // Define the user info and error message.
    let userInfo: string = login.user.username
      ? `{  _id: "${login.userId}", name: "${login.user.username}" }`
      : `{ _id: "${login.userId}" }`
    let errorMessage: string = `Failed to update user ${userInfo}.\n`
    // Log the error.
    databaseLogger.error(errorMessage, error)
    // Handle the error.
    return ApiResponse.error(error, response)
  }
}

export default updateUserPreferences
