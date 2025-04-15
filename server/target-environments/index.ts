import fs from 'fs'
import TargetEnvSchema from 'integration/library/target-env-classes'
import TargetSchema from 'integration/library/target-env-classes/targets'
import TargetEnvironment from 'metis/target-environments'
import TargetEnvRegistry from 'metis/target-environments/registry'
import { TTargetJson } from 'metis/target-environments/targets'
import FileToolbox from 'metis/toolbox/files'
import StringToolbox from 'metis/toolbox/strings'
import path from 'path'
import { TMetisServerComponents } from '../index'
import ServerTarget from './targets'

/**
 * A class for managing target environments on the server.
 */
export default class ServerTargetEnvironment extends TargetEnvironment<TMetisServerComponents> {
  // Implemented
  protected parseTargets(data: TTargetJson[]): ServerTarget[] {
    return data.map((datum: TTargetJson) => {
      return new ServerTarget(this, datum)
    })
  }

  // Implemented
  public register(): ServerTargetEnvironment {
    ServerTargetEnvironment.REGISTRY.register(this)
    return this
  }

  /**
   * A registry of all target environments.
   */
  public static readonly REGISTRY: TargetEnvRegistry<TMetisServerComponents> =
    new TargetEnvRegistry()

  /**
   * Scans the given directory for targets, adding
   * them to the given target environment.
   * @param directory The directory to search.
   * @param environment The target environment to add the
   * targets to.
   */
  private static scanTargetDirectory(
    directory: string,
    environment: ServerTargetEnvironment,
  ): void {
    let schemaFilePath = path.join(
      directory,
      ServerTargetEnvironment.TARGET_SCHEMA_FILE_NAME,
    )

    // If the directory provided is not a folder,
    // throw an error.
    if (!FileToolbox.isFolder(directory)) {
      throw new Error(
        `Cannot scan target directory. "${directory}" is not a folder.`,
      )
    }

    // If the schema file exists, grab the default export.
    if (fs.existsSync(schemaFilePath)) {
      let exportDefault: any = require(schemaFilePath).default

      // If there is no default export or the default
      // export is not a target schema.
      if (!exportDefault || !(exportDefault instanceof TargetSchema)) {
        console.warn(
          `Invalid schema found at "${schemaFilePath}". Skipping target...`,
        )
      }
      // Else, add the target to the environment.
      else {
        // Set the target ID.
        exportDefault.setId(directory)
        // Set the target environment ID.
        exportDefault.targetEnvId = environment._id
        // Add the target JSON.
        environment.targets.push(new ServerTarget(environment, exportDefault))
      }
    }

    // Scan subdirectories for additional targets.
    let directoryContents: string[] = fs
      .readdirSync(directory)
      .map((subdirectory) => StringToolbox.joinPaths(directory, subdirectory))

    for (let subdirectory of directoryContents) {
      if (FileToolbox.isFolder(subdirectory)) {
        this.scanTargetDirectory(subdirectory, environment)
      }
    }
  }

  /**
   * Scans the given directory for a target environment,
   * adding it to the registry.
   * @param directory The directory to search.
   */
  private static scanTargetEnvDirectory(directory: string): void {
    // Gather details.
    let schemaFilePath = path.join(
      directory,
      ServerTargetEnvironment.SCHEMA_FILE_NAME,
    )
    let targetFolderPath = path.join(
      directory,
      ServerTargetEnvironment.TARGET_FOLDER_NAME,
    )
    let invalidSchemaMessage = `No valid schema found at "${schemaFilePath}". Skipping target environment...`

    // If the directory provided is not a folder,
    // throw an error.
    if (!FileToolbox.isFolder(directory)) {
      throw new Error(
        `Cannot scan target environment directory. "${directory}" is not a folder.`,
      )
    }
    // If the index file does not exist, abort.
    if (!fs.existsSync(schemaFilePath)) {
      console.warn(invalidSchemaMessage)
      return
    }
    // If the target folder does not exist, abort.
    if (!fs.existsSync(targetFolderPath)) {
      console.warn(
        `No target folder found at "${targetFolderPath}". Skipping target environment...`,
      )
      return
    }

    // Grab the default export from the file.
    let exportDefault: any = require(schemaFilePath).default

    // If there is no default export or the default
    // export is not a target-environment schema, abort.
    if (!exportDefault || !(exportDefault instanceof TargetEnvSchema)) {
      console.warn(invalidSchemaMessage)
      return
    }

    // Set the ID of the target environment.
    exportDefault.setId(directory)
    // Create a new target environment.
    let environment = new ServerTargetEnvironment(exportDefault).register()

    // If the target environment has a target folder,
    // scan it for targets.
    // Scan the directory for targets.
    this.scanTargetDirectory(directory, environment)

    // If no targets were found, log a warning message.
    if (!environment.targets.length) {
      console.warn(`No targets found in "${environment.name}".`)
    }

    // Log the success of the integration.
    console.log(`Successfully integrated "${environment.name}" with METIS.`)
  }

  /**
   * Registers the internal, target environment in
   * the registry.
   */
  public static registerInternal(): void {
    new ServerTargetEnvironment(
      ServerTargetEnvironment.INTERNAL_TARGET_ENV,
    ).register()
  }

  /**
   * Scans the given directory for target environments,
   * adding all that are found to the registry.
   * @param directory The directory to search.
   * @param recursiveOptions Ignore this parameter.
   */
  public static scan(directory: string = this.DEFAULT_DIRECTORY): void {
    // If the directory provided is not a folder,
    // throw an error.
    if (!FileToolbox.isFolder(directory)) {
      throw new Error(
        `Cannot scan for target environments. "${directory}" is not a folder.`,
      )
    }

    // Scan the contents of the directory for
    // target environments.
    let directoryContents: string[] = fs
      .readdirSync(directory)
      .map((subdirectory) => StringToolbox.joinPaths(directory, subdirectory))

    for (let subdirectory of directoryContents) {
      if (FileToolbox.isFolder(subdirectory)) {
        ServerTargetEnvironment.scanTargetEnvDirectory(subdirectory)
      }
    }
  }

  /**
   * The file name for target environment schemas.
   */
  private static SCHEMA_FILE_NAME: string = 'index.ts'

  /**
   * The file name for target schemas.
   */
  private static TARGET_SCHEMA_FILE_NAME: string = 'schema.ts'

  /**
   * The folder name where targets are stored within
   * a target environment.
   */
  private static TARGET_FOLDER_NAME: string = 'targets'

  /**
   * The default directory to scan for target environments.
   */
  private static DEFAULT_DIRECTORY: string = path.join(
    process.cwd(), // "metis/server/"
    '../integration/target-env',
  )
}

/* -- TYPES -- */

/**
 * Options recurisvely passed when scanning directories.
 */
export type TScanEnvOptions = {
  /**
   * The target environment to which targets
   * should be added.
   */
  targetEnvironment?: ServerTargetEnvironment | null
}
