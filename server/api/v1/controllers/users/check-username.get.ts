import { UserModel } from '@server/database/models/users'
import { databaseLogger } from '@server/logging'
import type { TUsernameCheckJson } from '@shared/users/User'
import { ApiResponse } from '../../library/ApiResponse'

/**
 * Checks whether a username is available.
 * @param request The express request.
 * @param response The express response.
 * @returns A JSON body whose `status` is `'available'` when no user holds the
 * username, `'active'` when a current user holds it, or `'archived'` when a
 * deleted user holds it. All three outcomes are returned with a 200 status.
 */
export const checkUsername: TExpressHandler = async (request, response) => {
  // Extract the username from the query string.
  let username = request.query.username
  if (!username) {
    return ApiResponse.error(new Error('Username is required.'), response)
  }

  // The answer describes who currently holds the username, which can change
  // at any moment, so the browser must never reuse a stored copy.
  response.set('Cache-Control', 'no-store')

  // Express attaches an entity tag to the response, and when the caller sends
  // that tag back on the next check it answers with an empty 304 instead of
  // the result. Dropping the caller's copy keeps every check answered with a
  // real body, which is the only thing the caller can read a result from.
  delete request.headers['if-none-match']

  try {
    // Check if an active user already has this username.
    let activeUser = await UserModel.findOne({ username }).exec()
    if (activeUser) {
      return ApiResponse.sendJson<TUsernameCheckJson>(response, {
        status: 'active',
      })
    }

    // Check if an archived (deleted) user previously had this username.
    let archivedUser = await UserModel.findOne(
      { username, deleted: true },
      {},
      { includeDeleted: true },
    ).exec()
    if (archivedUser) {
      return ApiResponse.sendJson<TUsernameCheckJson>(response, {
        status: 'archived',
      })
    }

    // No user holds this username, so it is available.
    return ApiResponse.sendJson<TUsernameCheckJson>(response, {
      status: 'available',
    })
  } catch (error: any) {
    // Log the error. A username that is taken is an expected outcome
    // rather than a failure, so only a genuine lookup failure reaches here.
    databaseLogger.error(
      `Failed to check username "${username}" existence.\n`,
      error,
    )
    // Handle the error.
    return ApiResponse.error(error, response)
  }
}
