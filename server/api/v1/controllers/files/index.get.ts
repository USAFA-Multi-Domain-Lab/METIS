import type { Request, Response } from 'express-serve-static-core'
import { FileReferenceModel } from '../../../../database/models/file-references'
import { ApiResponse } from '../../library'

/**
 * Retrieves all file references from the database.
 * @param request The express request.
 * @param response The express response.
 * @resolves With the response to send to the client.
 * @rejects If an error occurs.
 */
const getFiles = async (request: Request, response: Response) => {
  const referenceJson = await FileReferenceModel.find().exec()
  return ApiResponse.sendJson(response, referenceJson)
}

export default getFiles
