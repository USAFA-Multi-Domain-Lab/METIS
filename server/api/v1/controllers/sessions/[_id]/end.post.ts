import { SessionServer } from '@server/sessions/SessionServer'
import type { ServerUser } from '@server/users/ServerUser'
import { ServerEmittedError } from '@shared/connect/errors/ServerEmittedError'
import { expressLogger } from '../../../../../logging'
import { ApiResponse } from '../../../library/ApiResponse'
import { StatusError } from '../../../library/StatusError'

/**
 * Cleanly ends a session. A started session is torn down before it is
 * destroyed, while an unstarted one is destroyed right away. Responds
 * as soon as the session begins ending, since teardown can take a while
 * to finish.
 * @param request The express request.
 * @param response The express response.
 * @returns HTTP status code.
 */
export const endSession: TExpressHandler = (request, response) => {
  try {
    let _id: string = request.params._id.toString()
    let session: SessionServer | undefined = SessionServer.get(_id)
    let requester: ServerUser = response.locals.user

    // If the session could not be found, throw an error.
    if (session === undefined) {
      throw new StatusError(`Session with ID "${_id}" not found.`, 404)
    }

    // Confirm the requester is authorized to write
    // to the session.
    if (!requester.canWriteToSession(session)) {
      return ApiResponse.sendStatus(response, 401)
    }

    // Begin ending the session. A session in the middle
    // of setup, teardown, or a reset can't be ended cleanly.
    let teardown: Promise<boolean>
    try {
      teardown = session.end()
    } catch (error: any) {
      if (
        !(error instanceof ServerEmittedError) ||
        error.code !== ServerEmittedError.CODE_SESSION_CONFLICTING_STATE
      ) {
        throw error
      }
      throw new StatusError(
        `Session with ID "${_id}" cannot be ended while it is ${session.state}.`,
        409,
      )
    }

    // Return response without waiting on teardown.
    teardown
      .then((tornDown) => {
        if (!tornDown) {
          expressLogger.error(`Failed to tear down session "${_id}".`)
        }
      })
      .catch((error) => {
        expressLogger.error(`Failed to end session "${_id}".\n`, error)
      })
    return ApiResponse.sendStatus(response, 202)
  } catch (error: any) {
    // Log the error.
    expressLogger.error('Failed to end session.\n', error)
    // Handle the error.
    return ApiResponse.error(error, response)
  }
}
