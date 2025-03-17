import { Request, Response } from 'express-serve-static-core'
import UserModel, { hashPassword } from 'metis/server/database/models/users'
import { databaseLogger } from 'metis/server/logging'
import { TUserJson } from 'metis/users'
import ApiResponse from '../../library/response'
/**
 * This will create a new user.
 * @param request The express request.
 * @param response The express response.
 * @returns The newly created user in JSON format.
 */
const createNewUser = async (request: Request, response: Response) => {
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

  // Hash the password.
  if (!!password) password = await hashPassword(password)

  try {
    // Create the new user.
    let userDoc = await UserModel.create({
      username,
      accessId,
      expressPermissionIds,
      firstName,
      lastName,
      needsPasswordReset,
      password,
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

export default createNewUser
