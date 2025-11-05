import type { Request, Response } from 'express-serve-static-core'
import type { TSessionBasicJson } from 'metis/sessions'
import { SessionServer } from '../../../../sessions'
import type { ServerUser } from '../../../../users'
import { ApiResponse } from '../../library'
/**
 * This will retrieve all publicly accessible sessions.
 * @param request The express request.
 * @param response The express response.
 * @returns All publicly accessible sessions in JSON format.
 */
const getSessions = (request: Request, response: Response) => {
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

export default getSessions
