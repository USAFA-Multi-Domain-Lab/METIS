import type { Request, Response } from 'express-serve-static-core'
import { expressLogger } from '../../../../logging'
import { SessionServer } from '../../../../sessions'
import type { ServerUser } from '../../../../users'
import { ApiResponse, StatusError } from '../../library'
/**
 * This will delete a session.
 * @param request The express request.
 * @param response The express response.
 * @returns HTTP status code.
 */
const deleteSession = (request: Request, response: Response) => {
  try {
    let _id: string = request.params._id
    let session: SessionServer | undefined = SessionServer.get(_id)
    let requester: ServerUser = response.locals.user

    // If the session could not be found, throw an error.
    if (session === undefined) {
      throw new StatusError(`Session with ID "${_id}" not found.`, 404)
    }

    // Determine authorization details for the requester
    // and the session.
    let ownsSession: boolean = session.ownerId === requester._id
    let hasNativeWrite: boolean = requester.isAuthorized([
      'sessions_write_native',
    ])
    let hasForeignWrite: boolean = requester.isAuthorized([
      'sessions_write_foreign',
    ])

    // Confirm the requester is authorized to write
    // to the session.
    if (
      (ownsSession && !hasNativeWrite) ||
      (!ownsSession && !hasForeignWrite)
    ) {
      return ApiResponse.sendStatus(response, 401)
    }

    // Destroy session and return response.
    session.destroy()
    return ApiResponse.sendStatus(response, 200)
  } catch (error: any) {
    // Log the error.
    expressLogger.error('Failed to delete session.\n', error)
    // Handle the error.
    return ApiResponse.error(error, response)
  }
}

export default deleteSession
