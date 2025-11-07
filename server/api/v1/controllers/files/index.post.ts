import type { MetisFileStore } from '@server/files/MetisFileStore'
import type { ServerUser } from '@server/users/ServerUser'
import { ApiResponse } from '../../library/ApiResponse'
import { StatusError } from '../../library/StatusError'

/**
 * This will handle file uploads.
 * @param request The express request.
 * @param response The express response.
 * @returns The response to send to the client.
 */
export const uploadFiles = async (
  request: TExpressRequest,
  response: TExpressResponse,
  fileStore: MetisFileStore,
) => {
  let currentUser: ServerUser = response.locals.user

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
    request.files.map((file) => fileStore.createReference(file, currentUser)),
  )

  // Send a response, including the resulting data
  // for the newly uploaded files.
  return response.json(uploadedFiles)
}
