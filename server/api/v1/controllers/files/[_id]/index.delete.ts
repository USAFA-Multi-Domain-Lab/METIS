import { ApiResponse } from '@server/api/v1/library/ApiResponse'
import { FileReferenceModel } from '@server/database/models/file-references'
import { databaseLogger } from '../../../../../logging'

/**
 * Marks a file as deleted in the database,
 * however the file in the file-store is maintained
 * for potential recovery, if something goes wrong.
 * @param request The express request.
 * @param fileStore The file-store instance to use.
 * @resolves With the response to send to the client.
 * @rejects If an error occurs.
 */
export const deleteFile: TExpressHandler = async (request, response) => {
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
