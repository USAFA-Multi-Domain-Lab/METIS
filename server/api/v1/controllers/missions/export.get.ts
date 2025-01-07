import { Request, Response } from 'express-serve-static-core'
import fs from 'fs'
import Mission, { TCommonMissionJson } from 'metis/missions'
import MetisServer from 'metis/server'
import InfoModel from 'metis/server/database/models/info'
import MissionModel from 'metis/server/database/models/missions'
import { StatusError } from 'metis/server/http'
import { databaseLogger } from 'metis/server/logging'
import path from 'path'
import { v4 as generateHash } from 'uuid'
import ApiResponse from '../../library/response'

/**
 * This will export a mission to a file.
 * @param request The express request.
 * @param response The express response.
 * @returns The mission file.
 */
const exportMission = async (request: Request, response: Response) => {
  // Extract the mission ID.
  let { _id: missionId } = request.params

  try {
    // Retrieve the database info.
    let info = await InfoModel.findOne().exec()
    // If the info is not found, throw an error.
    if (info === null) {
      throw new StatusError('Database info not found.', 404)
    }
    // Log the retrieval of the database info.
    databaseLogger.info('Database info retrieved.')

    // Retrieve the mission.
    let missionDoc = await MissionModel.findById(missionId).exec()
    // If the mission is not found, throw an error.
    if (missionDoc === null) {
      throw new StatusError(`Mission with ID "${missionId}" not found.`, 404)
    }
    // Log the retrieval of the mission.
    databaseLogger.info(`Mission with ID "${missionId}" retrieved.`)

    // Convert the mission document to JSON.
    let missionJson: TCommonMissionJson = missionDoc.toJSON()

    // Gather details for temporary file
    // that will be sent in the response.
    let tempSubfolderName: string = generateHash()
    let tempFileName: string = Mission.determineFileName(missionJson.name)
    let tempFolderPath: string = path.join(
      MetisServer.APP_DIR,
      '/temp/missions/exports/',
    )
    let tempSubfolderPath: string = path.join(tempFolderPath, tempSubfolderName)
    let tempFilePath: string = path.join(tempSubfolderPath, tempFileName)
    let tempFileContents = JSON.stringify(
      {
        ...missionJson,
        launchedAt: undefined,
        _id: undefined,
        deleted: undefined,
        schemaBuildNumber: info.schemaBuildNumber,
      },
      null,
      2,
    )

    // Create the temp directory
    // if it doesn't exist.
    if (!fs.existsSync(tempFolderPath)) {
      fs.mkdirSync(tempFolderPath, { recursive: true })
    }

    // Create the file.
    fs.mkdirSync(tempSubfolderPath, {})
    fs.writeFileSync(tempFilePath, tempFileContents)

    // Send it in the response.
    ApiResponse.sendFile(response, tempFilePath)
  } catch (error: any) {
    // Log the error.
    databaseLogger.error(
      `Failed to export mission with ID "${missionId}".\n`,
      error,
    )
    // Handle the error.
    return ApiResponse.error(error, response)
  }
}

export default exportMission
