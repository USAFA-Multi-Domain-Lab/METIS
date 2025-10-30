import fs from 'fs'
import { TMissionFileJson } from 'metis/missions/files'
import FileReferenceModel from 'metis/server/database/models/file-references'
import MissionModel from 'metis/server/database/models/missions'
import ServerFileToolbox from 'metis/server/toolbox/files'
import NumberToolbox from 'metis/toolbox/numbers'
import { AnyObject } from 'metis/toolbox/objects'
import { TCreatedByJson } from 'metis/users'
import path from 'path'
import MetisFileStore, { TMulterFile } from '../../files'
import { databaseLogger, expressLogger } from '../../logging'
import build_000005 from './builds/build_000005'
import build_000009 from './builds/build_000009'
import build_000010 from './builds/build_000010'
import build_000011 from './builds/build_000011'
import build_000012 from './builds/build_000012'
import build_000013 from './builds/build_000013'
import build_000017 from './builds/build_000017'
import build_000018 from './builds/build_000018'
import build_000020 from './builds/build_000020'
import build_000023 from './builds/build_000023'
import build_000024 from './builds/build_000024'
import build_000025 from './builds/build_000025'
import build_000026 from './builds/build_000026'
import build_000027 from './builds/build_000027'
import build_000028 from './builds/build_000028'
import build_000029 from './builds/build_000029'
import build_000032 from './builds/build_000032'
import build_000033 from './builds/build_000033'
import build_000034 from './builds/build_000034'
import build_000035 from './builds/build_000035'
import build_000036 from './builds/build_000036'
import build_000037 from './builds/build_000037'
import build_000038 from './builds/build_000038'
import build_000039 from './builds/build_000039'
import build_000040 from './builds/build_000040'
import build_000041 from './builds/build_000041'
import build_000042 from './builds/build_000042'
import build_000044 from './builds/build_000044'
import build_000045 from './builds/build_000045'
import build_000046 from './builds/build_000046'
import build_000047 from './builds/build_000047'
import build_000049 from './builds/build_000049'
import build_000050 from './builds/build_000050'
import build_000051 from './builds/build_000051'

/**
 * This class is responsible for executing the import of .metis and .cesar files.
 * @note Files will not be imported until the `execute` method is called.
 */
export default class MissionImport {
  /**
   * The array of files to import.
   */
  private files: TFileImportData[]

  /**
   * The file store where any supporting files
   * will be stored.
   */
  private fileStore: MetisFileStore

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
   * The options for the import.
   */
  private options: TMissionImportOptions

  /**
   * @param files An array of files to import.
   * @param fileStore The file store where any supporting files
   * will be stored.
   * @param options Additional options for the import.
   */
  public constructor(
    files: TFileImportData | TFileImportData[],
    fileStore: MetisFileStore,
    options: TMissionImportOptions = {},
  ) {
    if (!Array.isArray(files)) files = [files]
    this.files = files
    this.fileStore = fileStore
    this.options = options
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
  private toJson = (contents_string: string): AnyObject => {
    // The JSON object that will be returned.
    let contents_JSON: AnyObject

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
    contents_JSON: AnyObject,
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
   * Proccesses the given build number with the given build function.
   * @param missionData The mission data to process.
   * @param targetBuildNumber The target build number. If the mission data's
   * schema build number is less than this number, the build function will be
   * executed.
   * @param build The build function to execute, if the data is outdated.
   */
  private processBuild(
    missionData: any,
    targetBuildNumber: number,
    build: TMissionImportBuild,
  ): void {
    let { schemaBuildNumber } = missionData
    if (schemaBuildNumber < targetBuildNumber) build(missionData)
  }

  /**
   * Migrates the mission data if it is outdated.
   * @param missionData The mission data to migrate.
   */
  private migrateIfOutdated = (missionData: any): void => {
    this.processBuild(missionData, 5, /*****/ build_000005)
    this.processBuild(missionData, 9, /*****/ build_000009)
    this.processBuild(missionData, 10, /****/ build_000010)
    this.processBuild(missionData, 11, /****/ build_000011)
    this.processBuild(missionData, 12, /****/ build_000012)
    this.processBuild(missionData, 13, /****/ build_000013)
    this.processBuild(missionData, 17, /****/ build_000017)
    this.processBuild(missionData, 18, /****/ build_000018)
    this.processBuild(missionData, 20, /****/ build_000020)
    this.processBuild(missionData, 23, /****/ build_000023)
    this.processBuild(missionData, 24, /****/ build_000024)
    this.processBuild(missionData, 25, /****/ build_000025)
    this.processBuild(missionData, 26, /****/ build_000026)
    this.processBuild(missionData, 27, /****/ build_000027)
    this.processBuild(missionData, 28, /****/ build_000028)
    this.processBuild(missionData, 29, /****/ build_000029)
    this.processBuild(missionData, 32, /****/ build_000032)
    this.processBuild(missionData, 33, /****/ build_000033)
    this.processBuild(missionData, 34, /****/ build_000034)
    this.processBuild(missionData, 35, /****/ build_000035)
    this.processBuild(missionData, 36, /****/ build_000036)
    this.processBuild(missionData, 37, /****/ build_000037)
    this.processBuild(missionData, 38, /****/ build_000038)
    this.processBuild(missionData, 39, /****/ build_000039)
    this.processBuild(missionData, 40, /****/ build_000040)
    this.processBuild(missionData, 41, /****/ build_000041)
    this.processBuild(missionData, 42, /****/ build_000042)
    this.processBuild(missionData, 44, /****/ build_000044)
    this.processBuild(missionData, 45, /****/ build_000045)
    this.processBuild(missionData, 46, /****/ build_000046)
    this.processBuild(missionData, 47, /****/ build_000047)
    this.processBuild(missionData, 49, /****/ build_000049)
    this.processBuild(missionData, 50, /****/ build_000050)
    this.processBuild(missionData, 51, /****/ build_000051)
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
    mission: AnyObject,
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
        await this.fileStore.import(filePath, {
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
      let dataAsJson: AnyObject

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
        this.migrateIfOutdated(dataAsJson)
      } catch (error: any) {
        this.handleMissionImportError(file, error)
        return
      }

      // Model creation.
      try {
        // Parse creator info from options.
        const { createdByInfo } = this.options

        // Remove unnecessary fields.
        delete dataAsJson.schemaBuildNumber

        // Add creator info.
        if (createdByInfo) {
          dataAsJson.createdBy = createdByInfo.createdBy
          dataAsJson.createdByUsername = createdByInfo.createdByUsername
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
   * @returns A new `MissionImport` object.
   */
  public static fromMulterFiles = (
    multerFiles: TMulterFile[],
    fileStore: MetisFileStore,
    options: TMissionImportOptions = {},
  ): MissionImport => {
    let files = multerFiles.map((file) => ({
      name: file.filename,
      originalName: file.originalname,
      path: file.path,
    }))
    return new MissionImport(files, fileStore, options)
  }
}

/* -- TYPES -- */

/**
 * Options when creating a {@link MissionImport}
 * instance.
 */
export type TMissionImportOptions = {
  /**
   * Used when creating missions from the import
   * to set the user who created the mission.
   * @note By default, the system user is used.
   */
  createdByInfo?: Pick<TCreatedByJson, 'createdBy' | 'createdByUsername'>
}

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

/**
 * A build function that migrates mission import data
 * for a specific schema build number.
 */
export type TMissionImportBuild = (missionData: any) => void
