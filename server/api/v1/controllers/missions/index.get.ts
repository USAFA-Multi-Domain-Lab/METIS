import { Request, Response } from 'express-serve-static-core'
import MissionModel from 'metis/server/database/models/missions'
import { StatusError } from 'metis/server/http'
import { databaseLogger } from 'metis/server/logging'
import ApiResponse from '../../library/response'

/**
 * This will retrieve all missions.
 * @param request The express request.
 * @param response The express response.
 * @returns All missions in JSON format.
 */
const getMissions = async (request: Request, response: Response) => {
  try {
    // Retrieve all missions.
    let missions = await MissionModel.find(
      {},
      { structure: 0, forces: 0, prototypes: 0 },
    ).exec()
    // If no missions are found, throw an error.
    if (missions === null) {
      throw new StatusError('No missions were found.', 404)
    }
    // Return the missions.
    databaseLogger.info('All missions retrieved.')
    return ApiResponse.sendJson(response, missions)
  } catch (error: any) {
    // Log the error.
    databaseLogger.error('Failed to retrieve missions.\n', error)
    // Handle the error.
    return ApiResponse.error(error, response)
  }
}

export default getMissions
