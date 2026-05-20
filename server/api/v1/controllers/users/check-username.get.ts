import { UserModel } from '@server/database/models/users'
import { databaseLogger } from '@server/logging'
import { ApiResponse } from '../../library/ApiResponse'

/**
 * Checks whether a username already exists in the database.
 * @param request The express request.
 * @param response The express response.
 * @returns Whether the username exists, as a JSON boolean flag.
 */
export const checkUsername: TExpressHandler = async (request, response) => {
  // Extract the username from the query string.
  let { username } = request.query as { username: string }

  try {
    // Check if a user with this username already exists.
    let existingUser = await UserModel.findOne(
      { username },
      {},
      { includeDeleted: true },
    ).exec()
    // Log the result.
    databaseLogger.info(`Username "${username}" existence checked.`)
    // Return the result.
    return ApiResponse.sendJson(response, { exists: existingUser !== null })
  } catch (error: any) {
    // Log the error.
    databaseLogger.error(
      `Failed to check username "${username}" existence.\n`,
      error,
    )
    // Handle the error.
    return ApiResponse.error(error, response)
  }
}
