import { ApiResponse } from '@server/api/v1/library/ApiResponse'
import { StatusError } from '@server/api/v1/library/StatusError'
import { FileReferenceModel } from '@server/database/models/file-references'

/**
 * Retrieves a file reference from the database
 * based on the provided ID.
 * @param request The express request.
 * @param response The express response.
 * @resolves With the response to send to the client.
 * @rejects If an error occurs.
 */
export const getFile: TExpressHandler = async (request, response) => {
  const { _id } = request.params

  // Get reference to file.
  const referenceData = await FileReferenceModel.findById(_id).exec()
  if (!referenceData) {
    let error = new StatusError('File not found.', 404)
    return ApiResponse.error(error, response)
  }

  return ApiResponse.sendJson(response, referenceData)
}
