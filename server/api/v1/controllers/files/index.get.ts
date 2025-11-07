import { FileReferenceModel } from '@server/database/models/file-references'
import { ApiResponse } from '../../library/ApiResponse'

/**
 * Retrieves all file references from the database.
 * @param request The express request.
 * @param response The express response.
 * @resolves With the response to send to the client.
 * @rejects If an error occurs.
 */
export const getFiles: TExpressHandler = async (_, response) => {
  const referenceJson = await FileReferenceModel.find().exec()
  return ApiResponse.sendJson(response, referenceJson)
}
