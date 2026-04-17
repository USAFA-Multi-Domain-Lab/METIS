import { FileReferenceModel } from '@server/database/models/file-references'
import { MissionModel } from '@server/database/models/missions'
import type { TMulterFile } from '@server/files'
import type { MetisFileStore } from '@server/files/MetisFileStore'
import type { MetisServer } from '@server/MetisServer'
import { ServerFileToolbox } from '@server/toolbox/files/ServerFileToolbox'
import type { TMissionFileJson } from '@shared/missions/files/MissionFile'
import { NumberToolbox } from '@shared/toolbox/numbers/NumberToolbox'
import type { TAnyObject } from '@shared/toolbox/objects/ObjectToolbox'
import type { TCreatedByInfo } from '@shared/users/User'
import fs from 'fs'
import path from 'path'
import { databaseLogger, expressLogger } from '../../logging'
import type { ImportMigrationBuilder } from './ImportMigrationBuilder'

/**
 * This class is responsible for executing the import of .metis and .cesar files.
 * @note Files will not be imported until the `execute` method is called.
 */
export class MissionImport {
  /**
   * The array of files to import.
   */
  private files: TFileImportData[]

  private server: MetisServer

  /**
   * The file store where any supporting files
   * will be stored.
   */
  private get fileStore(): MetisFileStore {
    return this.server.fileStore
  }

  /**
   * Helps perform migrations for imports with outdated
   * data.
   */
  private get importMigrationBuilder(): ImportMigrationBuilder {
    return this.server.importMigrationBuilder
  }

  /**
   * Keeps track of the number of files that have been processed.
   */
  private fileProcessCount: number = 0

  /**
   * The results of the import.
   */
  private _results: TFileImportResults = {
    successfulImportCount: 0,
    failedImportCount: 0,
    failedImportErrorMessages: [],
  }

  /**
   * The results of the import.
   */
  public get results(): TFileImportResults {
    if (this.fileProcessCount < this.files.length) {
      throw Error('Cannot access results until all files have been processed.')
    }
    return { ...this._results }
  }

  /**
   * The user who created the import.
   */
  public createdBy: TCreatedByInfo

  /**
   * @param files An array of files to import.
   * @param server The MetisServer instance, used to access the file store
   * and the import migration builder.
   * @param createdBy Data identifying who is importing the missions.
   */
  public constructor(
    files: TFileImportData | TFileImportData[],
    server: MetisServer,
    createdBy: TCreatedByInfo,
  ) {
    if (!Array.isArray(files)) files = [files]
    this.files = files
    this.server = server
    this.createdBy = createdBy
  }

  /**
   * Handles the error that occurs when a mission fails to import.
   * @param file The file that failed to import.
   * @param error The error that occurred.
   */
  private handleMissionImportError = (
    file: TFileImportData,
    error: Error,
  ): void => {
    // Log the error.
    databaseLogger.error(
      `Failed to import mission "${file.originalName}".\n`,
      error,
    )
    // Create the error message.
    let fileName: string = file.originalName
    let errorMessage: string = error.message
    // Replace all backticks with asterisks.
    while (errorMessage.includes('`')) {
      errorMessage = errorMessage.replace('`', '*')
    }
    // Add the error message to the list of failed imports.
    this._results.failedImportErrorMessages.push({
      fileName,
      errorMessage,
    })
    // Increment the failed import count.
    this._results.failedImportCount++
    this.fileProcessCount++
  }

  /**
   * Converts the contents of the file to a `JSON` object.
   * @param contents_string The contents of the file as a `string`.
   * @returns The contents of the file as a `JSON` object.
   */
  private toJson = (contents_string: string): TAnyObject => {
    // The JSON object that will be returned.
    let contents_JSON: TAnyObject

    // Converts to JSON.
    try {
      contents_JSON = JSON.parse(contents_string)
    } catch (error: any) {
      // An error may occur due
      // to a syntax error with the JSON.
      let syntaxErrorRegularExpression: RegExp = /in JSON at position [0-9]+/
      let errorAsString: string = `${error}`
      let errorMessage: string = 'Error parsing JSON.\n'

      let syntaxErrorResults: RegExpMatchArray | null = errorAsString.match(
        syntaxErrorRegularExpression,
      )

      if (syntaxErrorResults !== null) {
        let match: string = syntaxErrorResults[0]
        let matchSplit: string[] = match.split(' ')
        let characterPosition: number = parseInt(
          matchSplit[matchSplit.length - 1],
        )
        let contextStart: number = Math.max(characterPosition - 24, 0)
        let contextEnd: number = Math.min(
          characterPosition + 24,
          contents_string.length - 1,
        )
        let surroundingContext: string = contents_string.substring(
          contextStart,
          contextEnd,
        )

        while (surroundingContext.includes('\n')) {
          surroundingContext = surroundingContext.replace('\n', ' ')
        }
        surroundingContext = surroundingContext.trim()

        errorMessage += `Unexpected token in JSON at character ${
          characterPosition + 1
        }.`
      }

      error.message = errorMessage

      throw error
    }

    // If the file passed all checks, return the JSON.
    return contents_JSON
  }

  /**
   * Validates the contents of the file.
   * @param file The file to validate.
   * @param contents_JSON The contents of the file as a `JSON` object.
   */
  private validateFileContents = (
    file: TFileImportData,
    contents_JSON: TAnyObject,
  ): void => {
    // If the JSON is not an object,
    // handle the error.
    if (!contents_JSON) {
      throw new Error(
        'Failed to parse JSON. This file is either not actually a .cesar file, not actually a .metis file, or is corrupted.',
      )
    }

    // If the schemaBuildNumber field is missing,
    // handle the error.
    if (isNaN(contents_JSON.schemaBuildNumber)) {
      throw new Error(
        'The schemaBuildNumber field is missing or invalid in the JSON.',
      )
    }

    // If the file's schemaBuildNumber is 9
    // or less and it is not a .cesar file,
    // it is skipped.
    if (
      contents_JSON.schemaBuildNumber <= 9 &&
      !file.originalName.toLowerCase().endsWith('.cesar')
    ) {
      throw new Error(
        `The file "${file.originalName}" was rejected because it did not have the .cesar extension.`,
      )
    }
    // If the file's schemaBuildNumber is
    // between 10 and 38 and it is not a
    // .metis file, it is skipped.
    else if (
      NumberToolbox.isBetween(contents_JSON.schemaBuildNumber, 10, 39) &&
      !file.originalName.toLowerCase().endsWith('.metis')
    ) {
      throw new Error(
        `The file "${file.originalName}" was rejected because it did not have the .metis extension.`,
      )
    }
    // If the file's schemaBuildNumber is 39
    // or greater and it is not a .metis.zip
    // file, it is skipped.
    else if (
      contents_JSON.schemaBuildNumber >= 40 &&
      !file.originalName.toLowerCase().endsWith('.metis.zip')
    ) {
      throw new Error(
        `The file "${file.originalName}" was rejected because it did not have the .metis.zip extension.`,
      )
    }
  }

  /**
   * Imports the files needed for the mission.
   * @param importDir The directory where the import has been
   * unzipped.
   * @param data The contents of the file as a `JSON` object.
   * @param sourceFile The file from where all data and associated
   * files were extracted.
   */
  private async importFiles(
    importDir: string,
    mission: TAnyObject,
    sourceFile: TFileImportData,
  ): Promise<void> {
    // Import the files.
    for (let missionFile of mission.files as TMissionFileJson[]) {
      // Handle absence of file reference data.
      if (typeof missionFile.reference !== 'object') {
        expressLogger.warn(
          `Deleted file-reference found in mission import ("${missionFile.reference}"). This file will not be included in the import.`,
        )
        continue
      }

      // Gather details.
      const { _id: referenceId } = missionFile.reference
      const filePath: string = path.join(
        importDir,
        'files',
        missionFile.reference.name,
      )

      // Determine if the referenced file is tracked
      // in the database already.
      let referenceExists = Boolean(
        await FileReferenceModel.exists({
          _id: missionFile.reference._id,
        }),
      )

      // If the file reference does not exist,
      // import it into the file store, which will
      // also create the reference.
      if (!referenceExists) {
        await this.fileStore.import(filePath, this.createdBy, {
          referenceId,
        })
      }

      // Replace the file reference in the mission file
      // with its ID.
      missionFile.reference = referenceId
    }
  }

  /**
   * Cleans up the uploads directory after all files
   * are imported via {@link MissionImport.execute}
   * method by removing temporary files and directories.
   */
  private cleanUpPostImport(): void {
    // Perform cleanup.
    try {
      // Remove the uploads directory.
      fs.rmSync(MissionImport.UPLOADS_DIRECTORY, {
        recursive: true,
        force: true,
      })
      // Recreate it as an empty directory.
      fs.mkdirSync(MissionImport.UPLOADS_DIRECTORY, { recursive: true })
    } catch (error) {
      databaseLogger.error(
        'Failed to clean up the uploads directory after import.\n',
        error,
      )
    }
  }

  /**
   * Executes the import of the mission.
   * @returns A promise that resolves when the import is complete.
   */
  public execute = async (): Promise<void> => {
    const promises = this.files.map(async (file) => {
      let importDir = path.join(
        MissionImport.UPLOADS_DIRECTORY,
        `contents_${file.name}`,
      )
      let importDataPath = path.join(importDir, 'data.json')
      let isZipFile: boolean = /^.*\.metis\.zip$/.test(file.originalName)
      let dataAsStr: string
      let dataAsJson: TAnyObject

      try {
        // Create a temporary directory to manage the
        // contents of the import.
        fs.mkdirSync(importDir)

        if (isZipFile) {
          // Unzip the file into a temporary directory.
          await ServerFileToolbox.unzipFiles(file.path, importDir)
        } else {
          // If the file is not a .metis.zip file, copy it
          // to the temporary directory.
          fs.copyFileSync(file.path, importDataPath)
        }

        // Reads files contents.
        dataAsStr = await fs.promises.readFile(importDataPath, {
          encoding: 'utf-8',
        })
      } catch (error: any) {
        error.message =
          'Failed to unpack mission import contents. This file is either invalid or corrupted.'

        this.handleMissionImportError(file, error)
        return
      }

      try {
        // Convert the contents of the file to JSON.
        dataAsJson = this.toJson(dataAsStr)
        // Validates the contents of the file.
        this.validateFileContents(file, dataAsJson)
        // Migrates if necessary.
        this.importMigrationBuilder.migrateIfOutdated(dataAsJson)
      } catch (error: any) {
        this.handleMissionImportError(file, error)
        return
      }

      // Model creation.
      try {
        // Remove unnecessary fields.
        delete dataAsJson.schemaBuildNumber

        // Add creator info.
        if (this.createdBy) {
          dataAsJson.createdBy = this.createdBy._id
          dataAsJson.createdByUsername = this.createdBy.username
        }

        // Import any files needed for the mission.
        if (isZipFile) await this.importFiles(importDir, dataAsJson, file)
        // Create the new mission.
        let missionDoc = await MissionModel.create(dataAsJson)
        // Log the creation of the mission.
        databaseLogger.info(`New mission created named "${missionDoc.name}".`)
        // Indicate that the file was successfully imported.
        this._results.successfulImportCount++
        this.fileProcessCount++
      } catch (error: any) {
        if (
          error.message.endsWith(
            'is not in schema and strict mode is set to throw.',
          )
        ) {
          error.message = error.message.replace(
            'is not in schema and strict mode is set to throw.',
            'is not in schema. Please delete this field and try again.',
          )
        }

        // Handle the error.
        this.handleMissionImportError(file, error)
        return
      }
    })

    try {
      // Wait for all promises to resolve.
      await Promise.all(promises)

      // Log any failed imports.
      if (this._results.failedImportCount > 0) {
        databaseLogger.error(
          `Failed to import ${this._results.failedImportCount} missions.`,
        )
      }
    } catch (error: any) {
      databaseLogger.error(
        'There was an error importing the missions.\n',
        error,
      )
    } finally {
      this.cleanUpPostImport()
    }
  }

  /**
   * The directory where the files will be uploaded.
   */
  public static UPLOADS_DIRECTORY: string = 'server/temp/missions/imports/'

  /**
   * Creates a new `MissionImport` object from an array
   * of MulterFile objects.
   * @param multerFiles An array of MulterFile objects to import.
   * @param server The MetisServer instance, used to access the file store
   * and the import migration builder.
   * @param createdBy Data identifying who is importing the missions.
   * @returns A new `MissionImport` object.
   */
  public static fromMulterFiles = (
    multerFiles: TMulterFile[],
    server: MetisServer,
    createdBy: TCreatedByInfo,
  ): MissionImport => {
    let files = multerFiles.map((file) => ({
      name: file.filename,
      originalName: file.originalname,
      path: file.path,
    }))
    return new MissionImport(files, server, createdBy)
  }
}

/* -- TYPES -- */

/**
 * File data needed to import a given file.
 */
export type TFileImportData = {
  /**
   * The current name of the file on the server.
   */
  name: string
  /**
   * The original name of the file.
   */
  originalName: string
  /**
   * The path to the file.
   */
  path: string
}

/**
 * The results of the import.
 */
export type TFileImportResults = {
  /**
   * The number of files that were successfully imported.
   */
  successfulImportCount: number
  /**
   * The number of files that failed to import.
   */
  failedImportCount: number
  /**
   * The error messages for the files that failed to import.
   */
  failedImportErrorMessages: Array<{
    /**
     * The name of the file that failed to import.
     */
    fileName: string
    /**
     * The error message for the file that failed to import.
     */
    errorMessage: string
  }>
}
