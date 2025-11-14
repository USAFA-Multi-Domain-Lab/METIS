import { SessionServer } from '@server/sessions/SessionServer'
import type { ServerUser } from '@server/users/ServerUser'
import type { TSessionBasicJson } from '@shared/sessions/MissionSession'
import { ApiResponse } from '../../library/ApiResponse'

/**
 * This will retrieve all publicly accessible sessions.
 * @param request The express request.
 * @param response The express response.
 * @returns All publicly accessible sessions in JSON format.
 */
export const getSessions: TExpressHandler = (request, response) => {
  // Define an array to store the sessions.
  let sessions: TSessionBasicJson[] = []
  let user: ServerUser = response.locals.user
  let hasAccess: boolean = user.isAuthorized('sessions_write')

  // Loop through all sessions and add the public sessions
  // to the array.
  for (let session of SessionServer.getAll()) {
    let hasNativeAccess: boolean =
      user.isAuthorized('sessions_write_native') &&
      session.ownerUsername === user.username

    if (
      session.config.accessibility === 'public' ||
      hasAccess ||
      hasNativeAccess
    ) {
      sessions.push(session.toBasicJson())
    }
  }

  // Return the response as JSON.
  return ApiResponse.sendJson(response, sessions)
}
