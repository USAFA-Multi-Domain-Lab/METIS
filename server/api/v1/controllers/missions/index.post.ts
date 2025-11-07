import { MissionModel } from '@server/database/models/missions'
import type { ServerUser } from '@server/users/ServerUser'
import type { TMissionSaveJson } from '@shared/missions/Mission'
import { databaseLogger } from '../../../../logging'
import { ApiResponse } from '../../library/ApiResponse'

/**
 * Creates a new mission.
 * @param request The express request.
 * @param response The express response.
 * @returns The new mission.
 */
export const createMission: TExpressHandler = async (request, response) => {
  let {
    name,
    versionNumber,
    seed,
    resourceLabel,
    structure,
    forces,
    prototypes,
    files,
    effects,
  } = request.body as TMissionSaveJson
  let currentUser: ServerUser = response.locals.user

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
      createdBy: currentUser._id,
      createdByUsername: currentUser.username,
      files,
      effects,
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
