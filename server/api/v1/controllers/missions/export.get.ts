import { Request, Response } from 'express-serve-static-core'
import fs from 'fs'
import Mission, { TMissionSaveJson } from 'metis/missions'
import MetisServer from 'metis/server'
import InfoModel from 'metis/server/database/models/info'
import MissionModel from 'metis/server/database/models/missions'
import MetisFileStore from 'metis/server/files'
import { StatusError } from 'metis/server/http'
import { databaseLogger } from 'metis/server/logging'
import ServerFileToolbox from 'metis/server/toolbox/files'
import path from 'path'
import { v4 as generateHash } from 'uuid'
import ApiResponse from '../../library/response'

/**
 * This will export a mission to a file.
 * @param request The express request.
 * @param response The express response.
 * @returns The mission file.
 */
const exportMission = async (
  request: Request,
  response: Response,
  fileStore: MetisFileStore,
) => {
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
    let missionDoc = await MissionModel.findById(missionId)
      .populate('files.reference')
      .exec()
    // If the mission is not found, throw an error.
    if (missionDoc === null) {
      throw new StatusError(`Mission with ID "${missionId}" not found.`, 404)
    }
    // Log the retrieval of the mission.
    databaseLogger.info(`Mission with ID "${missionId}" retrieved.`)

    // Convert the mission document to JSON.
    let missionJson: TMissionSaveJson = missionDoc.toJSON()

    // Gather details for temporary file
    // that will be sent in the response.
    let exportsRootDir: string = path.join(
      MetisServer.APP_DIR,
      '/temp/missions/exports/',
    )
    let exportId: string = generateHash()
    let exportDir: string = path.join(exportsRootDir, exportId)
    let exportFilesDir: string = path.join(exportDir, 'files')
    let exportZipName: string = Mission.determineFileName(missionJson.name)
    let exportZipPath: string = path.join(exportDir, exportZipName)
    let exportDataPath: string = path.join(exportDir, 'data.json')
    let exportDataContents = JSON.stringify(
      {
        ...missionJson,
        createdAt: undefined,
        updatedAt: undefined,
        launchedAt: undefined,
        _id: undefined,
        deleted: undefined,
        schemaBuildNumber: info.schemaBuildNumber,
      },
      null,
      2,
    )

    // Create necessary directories.
    if (!fs.existsSync(exportsRootDir)) {
      fs.mkdirSync(exportsRootDir, { recursive: true })
    }
    fs.mkdirSync(exportFilesDir, { recursive: true })

    // Create data file.
    fs.writeFileSync(exportDataPath, exportDataContents)

    // Copy files to the export directory.
    for (let missionFile of missionDoc.files) {
      let { reference } = missionFile

      // If the reference is not populated, throw an
      // error. This should theoretically not happen.
      if (typeof reference === 'string') {
        throw new StatusError(
          `File reference is not populated for mission.`,
          500,
        )
      }

      let source = fileStore.getFullPath(reference)
      let destination = path.join(exportFilesDir, reference.name)
      fs.copyFileSync(source, destination)
    }

    // Create the zip file.
    await ServerFileToolbox.zipFiles(exportZipPath, [
      exportDataPath,
      exportFilesDir,
    ])

    // Send it in the response.
    ApiResponse.sendFile(response, exportZipPath)
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
