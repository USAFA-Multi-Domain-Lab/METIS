import { Request, Response } from 'express-serve-static-core'
import MetisFileStore from 'metis/server/files'
import SessionServer from 'metis/server/sessions'
import ServerSessionMember from 'metis/server/sessions/members'

/**
 * Retrieves a mission file from the session, and
 * locates the file in the file-store. It then sends
 * the file to the client to be downloaded.
 * @param request The express request.
 * @param response The express response.
 * @param fileStore The file-store instance to use.
 * @resolves With the response to send to the client.
 * @rejects If an error occurs.
 */
const downloadMissionFile = async (
  request: Request,
  response: Response,
  fileStore: MetisFileStore,
) => {
  // Gather details.
  const { _id } = request.params
  const session: SessionServer = response.locals.session
  const sessionMember: ServerSessionMember = response.locals.sessionMember
  const assignedForce = sessionMember.force
  const file = session.getFile(_id)
  const hasCompleteVisibility = sessionMember.isAuthorized('completeVisibility')

  // If the file is not found, return 404.
  if (!file) return response.sendStatus(404)

  // The member is authorized to download the file
  // if they meet the following conditions:
  // - They are assigned to a force that has access to the file.
  // - They have complete visibility.
  if (
    (assignedForce && file.hasAccess(assignedForce)) ||
    hasCompleteVisibility
  ) {
    // Provide the file in the response to
    // be downloaded, if found.
    fileStore.provideInResponse(response, file.reference, file.name)
  } else {
    // The member is not authorized to download the file.
    // Return 403.
    return response.sendStatus(403)
  }
}

export default downloadMissionFile
