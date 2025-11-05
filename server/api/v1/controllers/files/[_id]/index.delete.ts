import type { Request, Response } from 'express-serve-static-core'
import { FileReferenceModel } from '../../../../../database'
import { databaseLogger } from '../../../../../logging'
import { ApiResponse } from '../../../library'

/**
 * Marks a file as deleted in the database,
 * however the file in the file-store is maintained
 * for potential recovery, if something goes wrong.
 * @param request The express request.
 * @param fileStore The file-store instance to use.
 * @resolves With the response to send to the client.
 * @rejects If an error occurs.
 */
const deleteFile = async (request: Request, response: Response) => {
  const { _id } = request.params

  // Delete the mission.
  let deletedFileReference = await FileReferenceModel.findByIdAndUpdate(
    _id,
    { deleted: true },
    { returnOriginal: false, runValidators: true },
  ).exec()
  // If the mission was not found, throw an error.
  if (deletedFileReference === null) {
    return ApiResponse.sendStatus(response, 404)
  }
  // Log the deletion.
  databaseLogger.info(`Deleted file reference with the ID "${_id}".`)
  // Return a successful response.
  return ApiResponse.sendStatus(response, 200)
}

export default deleteFile
