import fs from 'fs'
import TargetEnvSchema from 'integration/library/target-env-classes'
import TargetSchema from 'integration/library/target-env-classes/targets'
import TargetEnvironment from 'metis/target-environments'
import TargetEnvRegistry from 'metis/target-environments/registry'
import StringToolbox from 'metis/toolbox/strings'
import path from 'path'
import { TMetisServerComponents } from '../index'
import SessionServer from '../sessions'
import ServerFileToolbox from '../toolbox/files'
import TargetEnvironmentHook, { TTargetEnvMethods } from './hooks'
import ServerTarget from './targets'

/**
 * A class for managing target environments on the server.
 */
export default class ServerTargetEnvironment extends TargetEnvironment<TMetisServerComponents> {
  /**
   * A registry of hooks and their associated callbacks.
   * Callbacks will be called when the associated method
   * is invoked.
   */
  private hooks: TargetEnvironmentHook[]

  /**
   * @param id @see {@link ServerTargetEnvironment._id}
   * @param name @see {@link ServerTargetEnvironment.name}
   * @param description @see {@link ServerTargetEnvironment.description}
   * @param version @see {@link ServerTargetEnvironment.version}
   * @param targets @see {@link ServerTargetEnvironment.targets}
   * @param hooks Hooks to register with the target environment which will
   * be invoked at various points when used in a session.
   */
  public constructor(
    id: string,
    name: string,
    description: string,
    version: string,
    targets: ServerTarget[],
    hooks: TargetEnvironmentHook[],
  ) {
    super(id, name, description, version, targets)

    this.hooks = hooks
  }

  // Implemented
  public register(): ServerTargetEnvironment {
    ServerTargetEnvironment.REGISTRY.register(this)
    return this
  }

  /**
   * Invokes the given method, by calling all registered
   * hook callbacks for that method.
   * @param method The method to invoke.
   * @resolves When all callbacks have been invoked and resolved.
   * @rejects If any callback throws an error.
   */
  private async invoke(method: TTargetEnvMethods): Promise<void> {
    for (let hook of this.hooks) {
      if (hook.method === method) {
        await hook.invoke()
      }
    }
  }

  /**
   * Sets up the target environment for the given session.
   * @param session The session used for setup.
   * @resolves When setup is complete.
   * @rejects If setup fails.
   */
  public setUp(session: SessionServer): Promise<void> {
    return this.invoke('environment-setup')
  }

  /**
   * Tears down the target environment for the given session.
   * @param session The session used for teardown.
   * @resolves When teardown is complete.
   * @rejects If teardown fails.
   */
  public tearDown(session: SessionServer): Promise<void> {
    return this.invoke('environment-teardown')
  }

  /**
   * A registry of all target environments.
   */
  public static readonly REGISTRY: TargetEnvRegistry<TMetisServerComponents> =
    new TargetEnvRegistry()

  /**
   * The file name for target environment schemas.
   */
  private static readonly SCHEMA_FILE_NAME: string = 'schema.ts'

  /**
   * The folder name where targets are stored within
   * a target environment.
   */
  private static readonly TARGET_FOLDER_NAME: string = 'targets'

  /**
   * The default directory to scan for target environments.
   */
  private static readonly DEFAULT_DIRECTORY: string = path.join(
    process.cwd(), // "metis/server/"
    '../integration/target-env',
  )

  /**
   * The folder name for the METIS target environment.
   */
  private static readonly METIS_TARGET_ENV_FOLDER_NAME: string = 'METIS'

  /**
   * The ID for the METIS target environment.
   */
  public static get METIS_TARGET_ENV_ID(): string {
    // Get the path to the METIS target environment directory.
    const metisTargetEnvPath = path.join(
      this.DEFAULT_DIRECTORY,
      this.METIS_TARGET_ENV_FOLDER_NAME,
    )

    // If the file exists, return the ID.
    if (
      fs.existsSync(metisTargetEnvPath) &&
      ServerFileToolbox.isFolder(metisTargetEnvPath)
    ) {
      return path.basename(metisTargetEnvPath)
    }

    // If the file does not exist, throw an error.
    throw new Error(
      `METIS target environment not found at "${metisTargetEnvPath}".`,
    )
  }

  /**
   * @param schema The schema defining the target environment.
   * @returns A new {@link ServerTargetEnvironment} instance
   * created from the schema.
   */
  public static fromSchema(schema: TargetEnvSchema): ServerTargetEnvironment {
    return new ServerTargetEnvironment(
      schema._id,
      schema.name,
      schema.description,
      schema.version,
      [],
      schema.hooks,
    )
  }

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
      ServerTargetEnvironment.SCHEMA_FILE_NAME,
    )

    // If the directory provided is not a folder,
    // throw an error.
    if (!ServerFileToolbox.isFolder(directory)) {
      throw new Error(
        `Cannot scan target directory. "${directory}" is not a folder.`,
      )
    }

    // If the schema file exists, grab the default export.
    if (fs.existsSync(schemaFilePath)) {
      let targetSchema: any = require(schemaFilePath).default

      // If there is no default export or the default
      // export is not a target schema.
      if (!targetSchema || !(targetSchema instanceof TargetSchema)) {
        console.warn(
          `Invalid schema found at "${schemaFilePath}". Skipping target...`,
        )
      }
      // Else, add the target to the environment.
      else {
        // Set the target ID.
        targetSchema.setId(directory)
        // Set the target environment ID.
        targetSchema.targetEnvId = environment._id
        // Add the target JSON.
        environment.targets.push(
          ServerTarget.fromSchema(targetSchema, environment),
        )
      }
    }

    // Scan subdirectories for additional targets.
    let directoryContents: string[] = fs
      .readdirSync(directory)
      .map((subdirectory) => StringToolbox.joinPaths(directory, subdirectory))

    for (let subdirectory of directoryContents) {
      if (ServerFileToolbox.isFolder(subdirectory)) {
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
    if (!ServerFileToolbox.isFolder(directory)) {
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
    let environmentSchema: any = require(schemaFilePath).default

    // If there is no default export or the default
    // export is not a target-environment schema, abort.
    if (!environmentSchema || !(environmentSchema instanceof TargetEnvSchema)) {
      console.warn(invalidSchemaMessage)
      return
    }

    // Create a new target environment.
    let environment =
      ServerTargetEnvironment.fromSchema(environmentSchema).register()

    // If the target environment has a target folder,
    // scan it for targets.
    // Scan the directory for targets.
    this.scanTargetDirectory(targetFolderPath, environment)

    // If no targets were found, log a warning message.
    if (!environment.targets.length) {
      console.warn(`No targets found in "${environment.name}".`)
    }

    // Log the success of the integration.
    console.log(`Successfully integrated "${environment.name}" with METIS.`)
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
    if (!ServerFileToolbox.isFolder(directory)) {
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
      if (ServerFileToolbox.isFolder(subdirectory)) {
        ServerTargetEnvironment.scanTargetEnvDirectory(subdirectory)
      }
    }

    // Sort the registry to ensure that
    // the default METIS target environment is
    // always the first one in the list.
    ServerTargetEnvironment.REGISTRY.sort()
  }

  /**
   * Sets up all registered target environments for the given
   * session.
   * @param session The session used for setup.
   * @resolves When all target environments are set up.
   * @rejects If setup of any target environment fails.
   */
  public static async setUp(session: SessionServer): Promise<void> {
    // For each target environment in the registry, set it up.
    for (let targetEnv of ServerTargetEnvironment.REGISTRY.getAll()) {
      await targetEnv.setUp(session)
    }

    await session.applyMissionEffects('session-setup')
  }

  /**
   * Tears down all registered target environments for the given
   * session.
   * @param session The session used for teardown.
   * @resolves When all target environments are torn down.
   * @rejects If teardown of any target environment fails.
   */
  public static async tearDown(session: SessionServer): Promise<void> {
    // For each target environment in the registry, tear it down.
    for (let targetEnv of ServerTargetEnvironment.REGISTRY.getAll()) {
      await targetEnv.tearDown(session)
    }

    await session.applyMissionEffects('session-teardown')
  }
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
