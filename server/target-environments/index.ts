import fs from 'fs'
import TargetEnvironment, {
  TCommonTargetEnvJson,
  TTargetEnvOptions,
} from 'metis/target-environments'
import { TCommonTargetJson } from 'metis/target-environments/targets'
import path from 'path'
import { TServerMissionTypes } from '../missions'
import ServerTarget from './targets'

/**
 * A class for managing target environments on the server.
 */
export default class ServerTargetEnvironment extends TargetEnvironment<TServerMissionTypes> {
  /**
   * @param data The data to use to create the ServerTargetEnvironment.
   * @param options The options for creating the ServerTargetEnvironment.
   */
  public constructor(
    data: Partial<TCommonTargetEnvJson> = ServerTargetEnvironment.DEFAULT_PROPERTIES,
    options: TServerTargetEnvOptions = {},
  ) {
    super(data, options)

    // Add the target environment to the registry.
    ServerTargetEnvironment.registry.push(this)
    // Add the target environment JSON to the registry.
    ServerTargetEnvironment.registryJson.push(this.toJson())
  }

  // Implemented
  public parseTargets(data: TCommonTargetJson[]): ServerTarget[] {
    return data.map((datum: TCommonTargetJson) => {
      return new ServerTarget(this, datum)
    })
  }

  /**
   * A registry of all target environments.
   */
  private static registry: ServerTargetEnvironment[] = []

  /**
   * A registry of all the target environment JSON.
   */
  private static registryJson: TCommonTargetEnvJson[] = []

  /**
   * Grabs all the target environments from the registry.
   * @returns An array of all the target environments in the
   * registry.
   */
  public static getAll(): ServerTargetEnvironment[] {
    return ServerTargetEnvironment.registry
  }

  /**
   * Grabs a target environment from the registry by its ID.
   * @param id The ID of the target environment to grab.
   * @returns A target environment with the provided ID.
   */
  public static get(id: string): ServerTargetEnvironment | undefined {
    return ServerTargetEnvironment.registry.find(
      (targetEnvironment: ServerTargetEnvironment) =>
        targetEnvironment._id === id,
    )
  }

  /**
   * Grabs all the target environment JSON from the registry.
   * @returns An array with all the target environment JSON
   * in the registry.
   */
  public static getAllJson(): TCommonTargetEnvJson[] {
    return ServerTargetEnvironment.registryJson
  }

  /**
   * Grabs a target environment JSON from the registry by its ID.
   * @param id The ID of the target environment to grab.
   * @returns A target environment JSON with the provided ID.
   */
  public static getJson(id: string): TCommonTargetEnvJson | undefined {
    return ServerTargetEnvironment.registryJson.find(
      (targetEnvironment: TCommonTargetEnvJson) => targetEnvironment._id === id,
    )
  }

  /**
   * Grabs the target environments from the provided directory.
   * @param directory The directory to search.
   * @param targetEnvironmentJson The target environment JSON.
   * @param targetJson The target JSON.
   * @returns An array of target environment JSON.
   */
  public static scan(
    directory: string,
    targetEnvironmentJson: TCommonTargetEnvJson[] = [],
    targetJson: TCommonTargetJson[] = [],
  ): TCommonTargetEnvJson[] {
    // The blacklisted files.
    let blackListedFiles: string[] = [
      path.join(directory, '.DS_Store'),
      path.join(directory, '.gitkeep'),
    ]

    // If the directory is not blacklisted, search for typescript files.
    if (
      fs.lstatSync(directory).isDirectory() &&
      !blackListedFiles.includes(directory)
    ) {
      // The regex for target directories.
      let targetDirectoryRegex: RegExp = /^(@)[a-zA-Z0-9_-]+$/
      // The regex for index files.
      let indexFileRegex: RegExp = /^(index.ts)$/
      // The regex for target files.
      let targetFileRegex: RegExp = /^[a-zA-Z0-9_-]+(.ts)$/
      // Get the files in the directory.
      let directoryFiles: string[] = fs.readdirSync(directory)

      // Iterate over the files in the directory.
      directoryFiles.forEach((file: string) => {
        // Check if previous file is a directory.
        let isDirectory: boolean = fs.lstatSync(directory).isDirectory()
        // If the previous file is a directory, then set the current directory
        // to the previous file.
        let currentDirectory: string = isDirectory
          ? path.basename(directory)
          : ''
        // Check if the file is a file.
        let isFile: boolean = fs.lstatSync(path.join(directory, file)).isFile()
        // Check if the current directory is a target directory.
        let isTargetDirectory: boolean =
          isDirectory && targetDirectoryRegex.test(currentDirectory)
        // Check if the file is an index file or a target file.
        let isIndexFile: boolean = isFile && indexFileRegex.test(file)
        let isTargetFile: boolean =
          isFile && isTargetDirectory && targetFileRegex.test(file)

        // If the file is a typescript file and it's an index file...
        if (isIndexFile && !isTargetFile) {
          // Grab the default export from the file.
          let exportDefault: any = require(path.join(directory, file)).default

          // If the default export has an ID, a name, a description,
          // and a version, then it is a target environment.
          if (
            exportDefault &&
            exportDefault._id &&
            exportDefault.name &&
            exportDefault.description &&
            exportDefault.version
          ) {
            // Add the target environment JSON.
            targetEnvironmentJson.push(exportDefault)
          }
        }
        // If the file is a typescript file and it's a target file...
        else if (isTargetFile && !isIndexFile) {
          // Grab the default export from the file.
          let exportDefault: any = require(path.join(directory, file)).default

          // If the default export has an ID, a target environment ID, a name,
          // a description, a script, and args, then it is a target.
          if (
            exportDefault &&
            exportDefault._id &&
            exportDefault.targetEnvId &&
            exportDefault.name &&
            exportDefault.description &&
            exportDefault.script &&
            exportDefault.args
          ) {
            // Add the target JSON.
            targetJson.push(exportDefault)
          }
        }
        // Otherwise, the file is a directory.
        else {
          // If the file is a directory, recursively search for typescript files.
          this.scan(
            path.join(directory, file),
            targetEnvironmentJson,
            targetJson,
          )
        }
      })
    }

    // Add the targets to the target environments.
    targetJson.forEach((target: any) => {
      // Find the target environment that the target belongs to.
      let targetEnvironment: TCommonTargetEnvJson | undefined =
        targetEnvironmentJson.find(
          (targetEnvironment: TCommonTargetEnvJson) => {
            return targetEnvironment._id === target.targetEnvId
          },
        )

      // If the target environment is found, add the target to it.
      if (targetEnvironment) {
        // If the target environment does not have targets, then create an array.
        if (!targetEnvironment.targets) {
          targetEnvironment.targets = []
        }

        // Delete the target environment ID from the target.
        // Note: The target environment ID is not needed on the client.
        delete target.targetEnvId
        // Add the target to the target environment.
        targetEnvironment.targets.push(target)
      }
    })

    // Return the target environments.
    return targetEnvironmentJson
  }
}

/* ------------------------------ SERVER TARGET ENVIRONMENT TYPES ------------------------------ */

/**
 * Options for creating a new ServerTargetEnvironment object.
 */
export type TServerTargetEnvOptions = TTargetEnvOptions & {}
