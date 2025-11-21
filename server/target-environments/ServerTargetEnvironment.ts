import { TargetEnvSchema } from '@server/target-environments/schema/TargetEnvSchema'
import { ServerFileToolbox } from '@server/toolbox/files/ServerFileToolbox'
import { TargetEnvironment } from '@shared/target-environments/TargetEnvironment'
import { TargetEnvRegistry } from '@shared/target-environments/TargetEnvRegistry'
import type { TTargetEnvConfig } from '@shared/target-environments/types'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import fs from 'fs'
import path from 'path'
import type { SessionServer } from '../sessions/SessionServer'
import { EnvHookContext } from './context/EnvHookContext'
import type { TTargetEnvExposedEnvironment } from './context/TargetEnvContext'
import { ServerTarget } from './ServerTarget'
import type {
  TargetEnvironmentHook,
  TTargetEnvMethods,
} from './TargetEnvironmentHook'
import { TargetEnvSandboxing } from './TargetEnvSandboxing'

/**
 * A class for managing target environments on the server.
 */
export class ServerTargetEnvironment extends TargetEnvironment<TMetisServerComponents> {
  /**
   * A registry of hooks and their associated callbacks.
   * Callbacks will be called when the associated method
   * is invoked.
   */
  private hooks: TargetEnvironmentHook[]

  /**
   * The root directory for the target environment on
   * the file system.
   */
  public readonly rootDir: string

  /**
   * Override the configs getter to dynamically load from disk.
   * This enables hot-reload: any changes to configs.json are
   * immediately reflected without requiring a server restart.
   */
  public override get configs(): TTargetEnvConfig[] {
    return TargetEnvSandboxing.loadConfigs(this.rootDir)
  }

  /**
   * @param id @see {@link ServerTargetEnvironment._id}
   * @param name @see {@link ServerTargetEnvironment.name}
   * @param description @see {@link ServerTargetEnvironment.description}
   * @param version @see {@link ServerTargetEnvironment.version}
   * @param targets @see {@link ServerTargetEnvironment.targets}
   * @param rootDir The root directory path for this target environment.
   * @param hooks Hooks to register with the target environment which will
   * be invoked at various points when used in a session.
   * @param rootDir The root directory for the target environment on
   * the file system.
   */
  public constructor(
    id: string,
    name: string,
    description: string,
    version: string,
    targets: ServerTarget[],
    hooks: TargetEnvironmentHook[],
    rootDir: string,
  ) {
    super(id, name, description, version, targets)

    this.hooks = hooks
    this.rootDir = rootDir
  }

  /**
   * Loads a target from the given schema file path,
   * creating a {@link ServerTarget} instance and adding
   * it to the target environment.
   * @param schemaFilePath The path to the target schema file.
   */
  private loadTarget(schemaFilePath: string) {
    let targetSchema = TargetEnvSandboxing.loadTargetSchema(schemaFilePath)

    // Ensure ID of the target being loaded isn't
    // already in use within this target environment.
    for (let { _id } of this.targets) {
      if (targetSchema._id === _id) {
        throw new Error(
          `Duplicate target ID "${targetSchema._id}" found in target environment "${this.name}". Each target must have a unique ID.`,
        )
      }
    }

    // Add the target JSON.
    this.targets.push(
      ServerTarget.fromSchema(targetSchema, this, schemaFilePath),
    )
  }

  /**
   * @returns The properties from the target environment that are
   * safe to expose in target-environment code.
   */
  public toTargetEnvContext(): TTargetEnvExposedEnvironment {
    const self = this
    return {
      _id: self._id,
      name: self.name,
      description: self.description,
      version: self.version,
      get targets() {
        return self.targets.map((target) => target.toTargetEnvContext())
      },
    }
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
  private async invoke(
    method: TTargetEnvMethods,
    session: SessionServer,
  ): Promise<void> {
    for (let hook of this.hooks) {
      if (hook.method === method) {
        let context = new EnvHookContext(session, this)
        await context.execute((context) => hook.invoke(context))
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
    return this.invoke('environment-setup', session)
  }

  /**
   * Tears down the target environment for the given session.
   * @param session The session used for teardown.
   * @resolves When teardown is complete.
   * @rejects If teardown fails.
   */
  public tearDown(session: SessionServer): Promise<void> {
    return this.invoke('environment-teardown', session)
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
    process.cwd(),
    'integration/target-env',
  )

  /**
   * The folder name for the METIS target environment.
   */
  private static readonly METIS_TARGET_ENV_FOLDER_NAME: string = 'metis'

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
   * @param directory The directory containing the target
   * environment schema.
   * @returns A new {@link ServerTargetEnvironment} instance
   * created from the schema found at the provided directory.
   */
  public static fromDirectory(directory: string): ServerTargetEnvironment {
    let schemaPath = path.join(
      directory,
      ServerTargetEnvironment.SCHEMA_FILE_NAME,
    )
    let schema = TargetEnvSandboxing.loadEnvironmentSchema(schemaPath)
    return new ServerTargetEnvironment(
      schema._id,
      schema.name,
      schema.description,
      schema.version,
      [],
      schema.hooks,
      directory,
    )
  }

  /**
   * Scans the given directory for targets, adding them
   * to the given target environment.
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
      try {
        environment.loadTarget(schemaFilePath)
      } catch (error: any) {
        console.error(
          `Failed to load target schema at "${schemaFilePath}":\n ${error.message}.\n Skipping target...`,
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

    try {
      // Load and register the target environment.
      let environment =
        ServerTargetEnvironment.fromDirectory(directory).register()

      // If the target environment has a target folder,
      // scan it for targets.
      // Scan the directory for targets.
      this.scanTargetDirectory(targetFolderPath, environment)

      // If no targets were found, log a warning message.
      if (!environment.targets.length) {
        console.warn(`No valid targets found in "${environment.name}".`)
      }

      // Log the success of the integration.
      console.log(`Successfully integrated "${environment.name}" with METIS.`)
    } catch (error: any) {
      // Rethrow permission errors to crash the server
      if (error.name === 'ConfigPermissionError') {
        throw error
      }

      // Log other errors and skip this target environment
      console.error(
        `Failed to load target environment at "${schemaFilePath}": ${error.message}. Skipping target environment...`,
      )
      return
    }
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
   * This function is used to help track where calls are made.
   * A function or method can call this in order to determine
   * from within which target environment the call was made.
   * @returns The target environment schema.
   * @throws If the target environment schema can not be determined.
   */
  public static getCallerTargetEnv(): TargetEnvSchema {
    let filePath = ServerFileToolbox.getCallerFilePath()

    const algorithm = (folder = path.dirname(filePath)): TargetEnvSchema => {
      // If we have reached outside the target-env directory,
      // throw an error.
      if (
        /(?:[/\\])integration[/\\]target-env$/.test(folder) ||
        folder === path.dirname(folder)
      ) {
        throw new Error('No target environment schema file found in path.')
      }

      // If a schema file does not exist here,
      // move up one folder and try again.
      let schemaPath = path.join(folder, 'schema.ts')

      if (!fs.existsSync(schemaPath)) {
        return algorithm(path.dirname(folder))
      }

      // Determine if the schema file is valid.
      let schema = require(schemaPath).default

      if (!schema || !(schema instanceof TargetEnvSchema)) {
        return algorithm(path.dirname(folder))
      }

      // If all checks pass, return the schema.
      return schema
    }

    return algorithm()
  }
}
