import { Request, Response } from 'express-serve-static-core'
import FileReferenceModel from 'metis/server/database/models/file-references'
import { StatusError } from 'metis/server/http'
import ApiResponse from '../../../library/response'

/**
 * Retrieves a file reference from the database
 * based on the provided ID.
 * @param request The express request.
 * @param response The express response.
 * @resolves With the response to send to the client.
 * @rejects If an error occurs.
 */
const getFile = async (request: Request, response: Response) => {
  const { _id } = request.params

  // Get reference to file.
  const referenceData = await FileReferenceModel.findById(_id).exec()
  if (!referenceData) {
    let error = new StatusError('File not found.', 404)
    return ApiResponse.error(error, response)
  }

  return ApiResponse.sendJson(response, referenceData)
}

export default getFile
