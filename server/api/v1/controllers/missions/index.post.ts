import { Request, Response } from 'express-serve-static-core'
import { TCommonMissionJson } from 'metis/missions'
import MissionModel from 'metis/server/database/models/missions'
import { databaseLogger } from 'metis/server/logging'
import ApiResponse from '../../library/response'

/**
 * Creates a new mission.
 * @param request The express request.
 * @param response The express response.
 * @returns The new mission.
 */
const createMission = async (request: Request, response: Response) => {
  let {
    name,
    versionNumber,
    seed,
    resourceLabel,
    structure,
    forces,
    prototypes,
  } = request.body as TCommonMissionJson

  try {
    // Create mission.
    let missionDoc = await MissionModel.create({
      name,
      versionNumber,
      seed,
      resourceLabel,
      structure,
      forces,
      prototypes,
    })
    // Log the creation of the mission.
    databaseLogger.info(`New mission created named "${missionDoc.name}".`)
    // Return the new mission.
    return ApiResponse.sendJson(response, missionDoc)
  } catch (error: any) {
    // Log the error.
    databaseLogger.error('Failed to create mission.\n', error)
    // Handle the error.
    return ApiResponse.error(error, response)
  }
}

export default createMission
