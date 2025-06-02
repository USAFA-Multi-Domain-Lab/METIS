import { Request, Response } from 'express-serve-static-core'
import MetisFileStore from 'metis/server/files'
import { StatusError } from 'metis/server/http'
import ServerUser from 'metis/server/users'
import ApiResponse from '../../library/response'

/**
 * This will handle file uploads.
 * @param request The express request.
 * @param response The express response.
 * @returns The response to send to the client.
 */
const uploadFiles = async (
  request: Request,
  response: Response,
  fileStore: MetisFileStore,
) => {
  let user: ServerUser = response.locals.user

  // If no files are included in the request,
  // return a 400 status code.
  if (
    !request.files ||
    request.files.length === 0 ||
    !Array.isArray(request.files)
  ) {
    let error = new StatusError('No files were found in the request.', 400)
    return ApiResponse.error(error, response)
  }

  // Save references to the files in the database.
  const uploadedFiles = await Promise.all(
    request.files.map((file) => fileStore.createReference(file, user)),
  )

  // Send a response, including the resulting data
  // for the newly uploaded files.
  return response.json(uploadedFiles)
}

export default uploadFiles
