import { SessionServer } from '@server/sessions/SessionServer'
import type { ServerUser } from '@server/users/ServerUser'
import { expressLogger } from '../../../../logging'
import { ApiResponse } from '../../library/ApiResponse'
import { StatusError } from '../../library/StatusError'
/**
 * This will delete a session.
 * @param request The express request.
 * @param response The express response.
 * @returns HTTP status code.
 */
export const deleteSession: TExpressHandler = (request, response) => {
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
