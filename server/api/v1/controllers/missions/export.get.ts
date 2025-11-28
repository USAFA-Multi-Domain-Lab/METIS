import { InfoModel } from '@server/database/models/info'
import { MissionModel } from '@server/database/models/missions'
import type { MetisFileStore } from '@server/files/MetisFileStore'
import { MetisServer } from '@server/MetisServer'
import { ServerFileToolbox } from '@server/toolbox/files/ServerFileToolbox'
import type { TMissionSaveJson } from '@shared/missions/Mission'
import { Mission } from '@shared/missions/Mission'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import type { Request, Response } from 'express-serve-static-core'
import fs from 'fs'
import path from 'path'
import { databaseLogger, expressLogger } from '../../../../logging'
import { ApiResponse } from '../../library/ApiResponse'
import { StatusError } from '../../library/StatusError'

/**
 * This will export a mission to a file.
 * @param request The express request.
 * @param response The express response.
 * @returns The mission file.
 */
export const exportMission = async (
  request: Request,
  response: Response,
  fileStore: MetisFileStore,
) => {
  // Extract the mission ID.
  let { _id: missionId } = request.params

  try {
    // Gather data from the database.
    let info = await getDatabaseInfo()
    let missionJson: TMissionSaveJson = await getMissionData(missionId)

    // Create the export and get the zip path.
    let { exportZipPath, exportDir } = await createMissionExport(
      missionJson,
      info.schemaBuildNumber,
      fileStore,
    )

    // Send it in the response.
    ApiResponse.sendFile(response, exportZipPath)

    // Once complete, all files should
    // be deleted to preserve drive space.
    prepareCleanUp(response, exportDir)
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

/**
 * Prepares an export which can be downloaded by
 * the client.
 * @param missionJson The mission JSON to include in the export.
 * @param schemaBuildNumber The schema build number for the mission,
 * representing the version for which it was created.
 * @param fileStore The file store to use for file operations.
 * @resolves Once export has been created.
 * @rejectes If export fails.
 */
async function createMissionExport(
  missionJson: TMissionSaveJson,
  schemaBuildNumber: number,
  fileStore: MetisFileStore,
): Promise<TMissionExportResult> {
  // Gather details for temporary file
  // that will be sent in the response.
  let exportsRootDir: string = path.join(
    MetisServer.APP_DIR,
    '/temp/missions/exports/',
  )
  let exportId: string = StringToolbox.generateRandomId()
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
      schemaBuildNumber,
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
  for (let missionFile of missionJson.files) {
    let { reference } = missionFile

    // If the reference is not populated, warn and skip.
    if (typeof reference === 'string') {
      expressLogger.warn(
        `Deleted file-reference found in mission export ("${reference}"). This file will not be included in the export.`,
      )
      continue
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

  return { exportZipPath, exportDir }
}

/**
 * Retrieves the database info document.
 * @resolves With the info in the database.
 * @rejects With a StatusError if not found.
 */
async function getDatabaseInfo() {
  let info = await InfoModel.findOne().exec()
  if (info === null) {
    throw new StatusError('Database info not found.', 404)
  }
  databaseLogger.info('Database info retrieved.')
  return info
}

/**
 * Retrieves the mission document by ID and returns its JSON.
 * @param missionId The ID of the mission to retrieve.
 * @resolves With the requested mission JSON.
 * @rejects With a StatusError if not found.
 */
async function getMissionData(missionId: string): Promise<TMissionSaveJson> {
  let missionDoc = await MissionModel.findById(missionId).exec()
  if (missionDoc === null) {
    throw new StatusError(`Mission with ID "${missionId}" not found.`, 404)
  }
  databaseLogger.info(`Mission with ID "${missionId}" retrieved.`)
  let json: TMissionSaveJson = missionDoc.toJSON()
  return json
}

/**
 * Sets up handlers to clean up the temp files
 * when complete.
 */
function prepareCleanUp(response: Response, cleanUpDir: string) {
  const cleanUp = (): void => {
    fs.rmSync(cleanUpDir, { recursive: true, force: true })
  }

  // Delete export once finished.
  response.on('finish', cleanUp)
  response.on('error', cleanUp)
}

/**
 * The result type for a mission export.
 */
type TMissionExportResult = {
  /**
   * The path to the exported zip file.
   */
  exportZipPath: string
  /**
   * The directory containing the exported files.
   */
  exportDir: string
}
