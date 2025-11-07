import type { ServerUser } from '@server/users/ServerUser'
import type { TUserJson } from '@shared/users/User'
import { hashPassword, UserModel } from '../../../../database/models/users'
import { databaseLogger } from '../../../../logging'
import { ApiResponse } from '../../library/ApiResponse'
import { preventSystemUserWrite } from '../../library/users'
/**
 * This will create a new user.
 * @param request The express request.
 * @param response The express response.
 * @returns The newly created user in JSON format.
 */
export const createNewUser: TExpressHandler = async (request, response) => {
  // Extract data from the request body.
  let {
    username,
    accessId,
    expressPermissionIds,
    firstName,
    lastName,
    needsPasswordReset,
    password,
  } = request.body as TUserJson
  let currentUser: ServerUser = response.locals.user

  // Hash the password.
  if (!!password) password = await hashPassword(password)

  try {
    // Disable system-user write operations.
    preventSystemUserWrite({ newAccessId: accessId })

    // Create the new user.
    let userDoc = await UserModel.create({
      username,
      accessId,
      expressPermissionIds,
      firstName,
      lastName,
      needsPasswordReset,
      password,
      createdBy: currentUser._id,
      createdByUsername: currentUser.username,
    })
    // Log the successful creation of the user.
    databaseLogger.info(`New user created named "${username}".`)
    // Return the newly created user.
    return ApiResponse.sendJson(response, userDoc)
  } catch (error: any) {
    // Log the error.
    databaseLogger.error('Failed to create user.\n', error)
    // Handle the error.
    return ApiResponse.error(error, response)
  }
}
