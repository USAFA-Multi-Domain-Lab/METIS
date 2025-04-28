import { Request, Response } from 'express-serve-static-core'
import MetisFileStore from 'metis/server/files'
import SessionServer from 'metis/server/sessions'

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
  const file = session.getFile(_id)

  // Provide the file in the response to
  // be downloaded, if found.
  if (!file) return response.sendStatus(404)
  fileStore.provideInResponse(response, file.reference)
}

export default downloadMissionFile
