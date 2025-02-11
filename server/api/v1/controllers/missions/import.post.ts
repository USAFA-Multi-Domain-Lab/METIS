import { Request, Response } from 'express-serve-static-core'
import { StatusError } from 'metis/server/http'
import ApiResponse from '../../library/response'
import MissionImport from 'metis/server/missions/imports'

/**
 * This will import a mission from a file.
 * @param request The express request.
 * @param response The express response.
 * @returns The response to send to the client.
 */
const importMission = async (request: Request, response: Response) => {
  // If no files are included in the request,
  // return a 400 status code.
  if (
    !request.files ||
    request.files.length === 0 ||
    !Array.isArray(request.files)
  ) {
    let error = new StatusError('No files were found in the request.', 400)
    return ApiResponse.error(error, response)
  }

  // Create a new mission-import instance.
  let missionImport = MissionImport.fromMulterFiles(request.files)

  // Execute the mission import.
  await missionImport.execute()

  // Send a response.
  ApiResponse.sendJson(response, missionImport.results)
}

export default importMission
