import fs from 'fs'
import TargetEnvSchema from 'integration/library/target-env-classes'
import TargetSchema from 'integration/library/target-env-classes/targets'
import TargetEnvironment, { TTargetEnvJson } from 'metis/target-environments'
import { TTargetJson } from 'metis/target-environments/targets'
import path from 'path'
import { TMetisServerComponents } from '../index'
import ServerTarget from './targets'

/**
 * A class for managing target environments on the server.
 */
export default class ServerTargetEnvironment extends TargetEnvironment<TMetisServerComponents> {
  /**
   * @param data The data to use to create the ServerTargetEnvironment.
   * @param options The options for creating the ServerTargetEnvironment.
   */
  public constructor(
    data: Partial<TTargetEnvJson> = ServerTargetEnvironment.DEFAULT_PROPERTIES,
  ) {
    super(data)

    // Add the target environment to the registry.
    ServerTargetEnvironment.registry.push(this)
    // Add the target environment JSON to the registry.
    ServerTargetEnvironment.registryJson.push(this.toJson())
  }

  // Implemented
  protected parseTargets(data: TTargetJson[]): ServerTarget[] {
    return data.map((datum: TTargetJson) => {
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
  private static registryJson: TTargetEnvJson[] = []

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
  public static getAllJson(): TTargetEnvJson[] {
    return ServerTargetEnvironment.registryJson
  }

  /**
   * Grabs a target environment JSON from the registry by its ID.
   * @param id The ID of the target environment to grab.
   * @returns A target environment JSON with the provided ID.
   */
  public static getJson(id: string): TTargetEnvJson | undefined {
    return ServerTargetEnvironment.registryJson.find(
      (targetEnvironment: TTargetEnvJson) => targetEnvironment._id === id,
    )
  }

  /**
   * Grabs the target environments from the default/provided directory.
   * @param directory The directory to search.
   * @returns An array of target environment JSON.
   */
  public static scan(
    directory: string = this.DEFAULT_DIRECTORY,
  ): TTargetEnvJson[] {
    let blackListedFiles: string[] = [
      path.join(directory, '.DS_Store'),
      path.join(directory, '.gitkeep'),
    ]
    let isDirectory: boolean = fs.lstatSync(directory).isDirectory()

    // If the directory is not blacklisted, search for typescript files.
    if (isDirectory && !blackListedFiles.includes(directory)) {
      let directoryFiles: string[] = fs.readdirSync(directory)

      // Iterate over the files in the directory.
      directoryFiles.forEach((file: string) => {
        // Create the new path.
        let newPath: string = path.join(directory, file)
        // Check if the new path is a typescript file.
        let isTsFile = fs.lstatSync(newPath).isFile() && file.endsWith('.ts')

        // If the file is a typescript file...
        if (isTsFile) {
          // Grab the default export from the file.
          let exportDefault: any = require(newPath).default

          // If there is no default export...
          if (!exportDefault) {
            // Log an error.
            console.error(
              `No default export found in "${newPath}." Skipping...`,
            )
          }

          // If the default export is a target environment...
          if (exportDefault instanceof TargetEnvSchema) {
            // Set the ID of the target environment.
            exportDefault.setId(directory)
            // Add the target environment JSON.
            this.targetEnvRegistry.push(exportDefault)
          }
          // Or, if the default export is a target and
          // a target environment has been scanned...
          else if (
            exportDefault instanceof TargetSchema &&
            this.lastTargetEnvScannned
          ) {
            // Set the target ID.
            exportDefault.setId(directory)
            // Set the target environment ID.
            exportDefault.targetEnvId = this.lastTargetEnvScannned._id
            // Add the target JSON.
            this.lastTargetEnvScannned.targets.push(exportDefault)
          }
        }
        // Otherwise, the new path is a directory.
        else if (isDirectory) {
          // Move to the new path.
          this.scan(newPath)
        }
      })
    }

    // Return the target environments.
    return this.targetEnvRegistry
  }

  /**
   * A registry of all the target environments found in the last scan.
   */
  private static targetEnvRegistry: TTargetEnvJson[] = []

  /**
   * The last target environment scanned.
   */
  private static get lastTargetEnvScannned(): TTargetEnvJson | undefined {
    return this.targetEnvRegistry[this.targetEnvRegistry.length - 1]
  }

  /**
   * The default directory to scan for target environments.
   */
  private static DEFAULT_DIRECTORY: string = path.join(
    process.cwd(), // "metis/server/"
    '../integration/target-env',
  )
}
