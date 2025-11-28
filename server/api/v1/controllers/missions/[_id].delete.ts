import { MissionModel } from '@server/database/models/missions'
import { databaseLogger } from '../../../../logging'
import { ApiResponse } from '../../library/ApiResponse'
import { StatusError } from '../../library/StatusError'

/**
 * This will delete a mission.
 * @param request The express request.
 * @param response The express response.
 * @returns A successful API response.
 */
export const deleteMission: TExpressHandler = async (request, response) => {
  // Extract the necessary data from the request.
  let { _id: missionId } = request.params

  try {
    // Delete the mission.
    let deletedMissionDoc = await MissionModel.findByIdAndUpdate(
      missionId,
      { deleted: true },
      { returnOriginal: false, runValidators: true },
    ).exec()
    // If the mission was not found, throw an error.
    if (deletedMissionDoc === null) {
      throw new StatusError(`Mission with ID "${missionId}" not found.`, 404)
    }
    // Log the deletion.
    databaseLogger.info(`Deleted mission with the ID "${missionId}".`)
    // Return a successful response.
    return ApiResponse.sendStatus(response, 200)
  } catch (error: any) {
    // Log the error.
    databaseLogger.error(
      `Failed to delete mission with the ID "${missionId}".\n`,
      error,
    )
    // Handle the error.
    return ApiResponse.error(error, response)
  }
}
