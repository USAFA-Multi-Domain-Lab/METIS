import { MissionModel } from '@server/database/models/missions'
import { databaseLogger } from '../../../../logging'
import { ApiResponse } from '../../library/ApiResponse'
import { StatusError } from '../../library/StatusError'

/**
 * This will retrieve a specific mission.
 * @param request The express request.
 * @param response The express response.
 * @returns The mission in JSON format.
 */
export const getMission: TExpressHandler = async (request, response) => {
  // Extract the mission ID.
  let { _id: missionId } = request.params

  try {
    // Retrieve the mission.
    let missionDoc = await MissionModel.findById(missionId).exec()
    // If the mission is not found, throw an error.
    if (missionDoc === null) {
      throw new StatusError(`Mission with ID "${missionId}" not found.`, 404)
    }
    // Return the mission.
    databaseLogger.info(`Mission with ID "${missionId}" retrieved.`)
    return ApiResponse.sendJson(response, missionDoc)
  } catch (error: any) {
    // Log the error.
    databaseLogger.error(
      `Failed to retrieve mission with ID "${missionId}".\n`,
      error,
    )
    // Handle the error.
    return ApiResponse.error(error, response)
  }
}
