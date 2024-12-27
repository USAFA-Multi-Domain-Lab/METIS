import { Request, Response } from 'express-serve-static-core'
import { TCommonMissionJson } from 'metis/missions'
import MissionModel from 'metis/server/database/models/missions'
import { StatusError } from 'metis/server/http'
import { databaseLogger } from 'metis/server/logging'
import ApiResponse from '../../library/response'

/**
 * This will update a mission.
 * @param request The express request.
 * @param response The express response.
 * @returns The updated mission in JSON format.
 */
const updateMission = async (request: Request, response: Response) => {
  // Extract the necessary data from the request.
  let missionUpdates = request.body as Partial<TCommonMissionJson>
  let { _id: missionId, name } = missionUpdates

  try {
    // Update the mission.
    let missionDoc = await MissionModel.findByIdAndModify(
      missionId,
      {},
      { returnOriginal: false, runValidators: true },
      missionUpdates,
    )
    // If the mission is not found, throw an error.
    if (missionDoc === null) {
      throw new StatusError(`Mission with ID "${missionId}" not found.`, 404)
    }
    // Log the successful update of the mission.
    databaseLogger.info(`Mission with ID "${missionId}" updated.`)
    // Send a successful response.
    return ApiResponse.sendJson(response, missionDoc)
  } catch (error: any) {
    // Define the mission info and error message.
    let missionInfo: string = name
      ? `{  _id: "${missionId}", name: "${name}" }`
      : `{ _id: "${missionId}" }`
    let errorMessage: string = `Failed to update mission ${missionInfo}.\n`
    // Log the error.
    databaseLogger.error(errorMessage, error)
    // Handle the error.
    return ApiResponse.error(error, response)
  }
}

export default updateMission
