import { UserModel } from '@server/database/models/users'
import { databaseLogger } from '@server/logging'
import { ApiResponse } from '../../library/ApiResponse'
import { StatusError } from '../../library/StatusError'

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
    // Check if an active user already has this username.
    let activeUser = await UserModel.findOne({ username }).exec()
    if (activeUser) {
      throw new StatusError(`Username "${username}" is already in use.`, 409)
    }

    // Check if an archived (deleted) user previously had this username.
    let archivedUser = await UserModel.findOne(
      { username, deleted: true },
      {},
      { includeDeleted: true },
    ).exec()
    if (archivedUser) {
      throw new StatusError(`Username "${username}" has been archived.`, 410)
    }

    // Log the result.
    databaseLogger.info(`Username "${username}" existence checked.`)
    // Username is available.
    return ApiResponse.sendJson(response, { exists: false })
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
