import { Request, Response } from 'express-serve-static-core'
import { StatusError } from 'metis/server/http'
import { expressLogger } from 'metis/server/logging'
import SessionServer from 'metis/server/sessions'
import ApiResponse from '../../library/response'
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

    // If the session could not be found, throw an error.
    if (session === undefined) {
      throw new StatusError(`Session with ID "${_id}" not found.`, 404)
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
