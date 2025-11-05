import type { Request, Response } from 'express-serve-static-core'
import { FileReferenceModel } from '../../../../../database'
import type { MetisFileStore } from '../../../../../files'
import { ServerFileReference } from '../../../../../files'
import { ApiResponse, StatusError } from '../../../library'

/**
 * Retrieves a file reference from the database
 * based on the provided ID, then locates the file
 * in the file-store and sends the file to the client
 * to be downloaded.
 * @param request The express request.
 * @param response The express response.
 * @param fileStore The file-store instance to use.
 * @resolves With the response to send to the client.
 * @rejects If an error occurs.
 */
const downloadFile = async (
  request: Request,
  response: Response,
  fileStore: MetisFileStore,
) => {
  const { _id } = request.params

  // Get reference to file.
  const referenceData = await FileReferenceModel.findById(_id).exec()
  if (!referenceData) {
    let error = new StatusError('File not found.', 404)
    return ApiResponse.error(error, response)
  }
  const reference = ServerFileReference.fromJson(referenceData)

  // Provide the file in the response.
  fileStore.provideInResponse(response, reference)
}

export default downloadFile
