import { Request, Response } from 'express-serve-static-core'
import MissionModel from 'metis/server/database/models/missions'
import { StatusError } from 'metis/server/http'
import { databaseLogger } from 'metis/server/logging'
import ServerUser from 'metis/server/users'
import ApiResponse from '../../library/response'

/**
 * This will copy a mission.
 * @param request The express request.
 * @param response The express response.
 * @returns The copied mission in JSON format.
 */
const copyMission = async (request: Request, response: Response) => {
  // Extract the necessary data from the request.
  let body = request.body
  let { originalId, copyName } = body
  let currentUser: ServerUser = response.locals.user

  try {
    // Retrieve the original mission.
    let originalMissionDoc = await MissionModel.findById(originalId).exec()
    // If the original mission is not found, throw an error.
    if (originalMissionDoc === null) {
      throw new StatusError(
        `Original mission with ID "${originalId}" not found.`,
        404,
      )
    }
    // Create the copy of the mission.
    let copiedMissionDoc = await MissionModel.create({
      name: copyName,
      versionNumber: originalMissionDoc.versionNumber,
      structure: originalMissionDoc.structure,
      forces: originalMissionDoc.forces,
      prototypes: originalMissionDoc.prototypes,
      files: originalMissionDoc.files,
      createdBy: currentUser._id,
      createdByUsername: currentUser.username,
    })
    // Return a successful API response.
    return ApiResponse.sendJson(response, copiedMissionDoc)
  } catch (error: any) {
    // Log the error.
    databaseLogger.error(
      `Failed to copy mission { originalId: "${originalId}", copyName: "${copyName}" }.\n`,
      error,
    )
    // Handle the error.
    return ApiResponse.error(error, response)
  }
}

export default copyMission
