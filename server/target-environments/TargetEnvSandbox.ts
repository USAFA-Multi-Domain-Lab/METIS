import { targetEnvLogger } from '@server/logging'
import { TargetEnvConfig } from '@shared/target-environments/TargetEnvConfig'
import type { TTargetEnvConfig } from '@shared/target-environments/types'
import fs from 'node:fs'
import Module from 'node:module'
import path from 'node:path'
import * as tsconfigPaths from 'tsconfig-paths'
import type { RegisterParams } from 'tsconfig-paths/lib/register'
import { z as zod } from 'zod'
import { ConfigPermissionError } from './ConfigPermissionError'
import { TargetEnvSchema } from './schema/TargetEnvSchema'
import { TargetSchema } from './schema/TargetSchema'

/**
 * Sandboxes modules loaded from target environments
 * to restrict import paths to permitted locations.
 */
export class TargetEnvSandbox {
  public constructor(
    /**
     * The root directory of the target environment.
     */
    public rootDir: string,
  ) {}

  /**
   * Load a module under the plugin sandbox. Optionally pick a value
   * from the loaded module (e.g., its default export).
   */
  private loadModule<T = unknown>(modulePath: string): T {
    let InternalModule = Module as InternalModuleType
    let originalLoad = InternalModule._load
    let { rootDir } = this
    let targetEnvId = path.basename(rootDir)

    InternalModule._load = function (
      request: string,
      parent: NodeJS.Module | null,
      isMain?: boolean,
    ) {
      const resolve = () => {
        return originalLoad(request, parent, isMain)
      }

      // Allow Node.js built-in modules (they don't resolve to file paths)
      if (
        Module.builtinModules.includes(request) ||
        request.startsWith('node:')
      ) {
        return resolve()
      }
      // Resolve if the request is a non-relative import
      // inside the target environment.
      if (request === targetEnvId || request.startsWith(`${targetEnvId}/`)) {
        return resolve()
      }

      // First, resolve the request to an absolute filename if possible.
      let requestAbsolutePath: string
      try {
        requestAbsolutePath = InternalModule._resolveFilename(
          request,
          parent ?? null,
          false,
        )
      } catch (error: any) {
        const isModuleNotFoundError =
          error.message.includes('Cannot find module') ||
          error.code === 'MODULE_NOT_FOUND'

        if (isModuleNotFoundError) {
          let msg =
            `Module resolution failed for "${path.dirname(request)}".` +
            ` The module "${path.basename(request)}" could not be found.`

          error.message = msg
          throw error
        }

        throw new Error(
          `Module resolution failed for "${request}". Plugins can only import from their own files, integration/library (@metis/*), or Node.js built-in modules.`,
        )
      }

      // Further determine details concerning the import
      // location.
      let parentFilename = parent?.filename
      let isParentInEnv =
        parentFilename && TargetEnvSandbox.isPathInside(parentFilename, rootDir)
      let isRequestInEnv = TargetEnvSandbox.isPathInside(
        requestAbsolutePath,
        rootDir,
      )
      let isRequestInLibrary = TargetEnvSandbox.isPathInside(
        requestAbsolutePath,
        TargetEnvSandbox.LIBRARY_ROOT,
      )

      // If the import is not from allowed locations, throw an error.
      if (isParentInEnv && !isRequestInEnv && !isRequestInLibrary) {
        TargetEnvSandbox.throwIfInside(
          requestAbsolutePath,
          TargetEnvSandbox.NODE_MODULES_ROOT,
          `NPM package import blocked: "${request}" -> "${requestAbsolutePath}". Plugins cannot directly import npm packages. Use @metis library exports instead.`,
        )
        TargetEnvSandbox.throwIfInside(
          requestAbsolutePath,
          TargetEnvSandbox.SHARED_ROOT,
          `Shared folder import blocked: "${requestAbsolutePath}". Plugins may not import from @shared; use @metis library exports instead.`,
        )
        TargetEnvSandbox.throwIfInside(
          requestAbsolutePath,
          TargetEnvSandbox.SERVER_ROOT,
          `Server folder import blocked: "${requestAbsolutePath}". Plugins may not import from @server; use @metis library exports instead.`,
        )
        TargetEnvSandbox.throwIfInside(
          requestAbsolutePath,
          TargetEnvSandbox.TARGET_ENV_ROOT,
          `Cross-plugin import blocked: "${requestAbsolutePath}". Plugins may only access their own files or integration/library.`,
        )
        throw new Error(
          `Unauthorized import blocked: "${request}" -> "${requestAbsolutePath}". Plugins may only import from their own files, integration/library (@metis/*), or Node.js built-in modules.`,
        )
      }

      return resolve()
    }

    const restoreTsConfig = tsconfigPaths.register(
      TargetEnvSandbox.tsconfigPathArgs,
    )

    try {
      return require(modulePath).default
    } finally {
      InternalModule._load = originalLoad
      restoreTsConfig()
    }
  }

  /**
   * Loads the target environment schema for the
   * target-environment located at the root directory.
   * @returns The loaded {@link TargetEnvSchema} instance.
   */
  public loadEnvironment(): TargetEnvSchema {
    let environmentPath = path.join(this.rootDir, 'schema.ts')
    let environmentSchema = this.loadModule<TargetEnvSchema>(environmentPath)

    // Handle invalid target schema export.
    if (!(environmentSchema instanceof TargetEnvSchema)) {
      throw new Error(
        `The module at path "${environmentPath}" does not export a valid TargetEnvSchema instance.`,
      )
    }

    return environmentSchema
  }

  /**
   * Validates that configs.json has proper read and write permissions.
   * @param rootDir The root directory of the target environment.
   * @throws ConfigPermissionError if configs.json exists but is not readable or writable.
   */
  public static validateConfigPermissions(rootDir: string): void {
    let envConfigsPath = path.join(rootDir, 'configs.json')
    let targetEnvId = path.basename(rootDir)

    // If no config file exists, validation passes
    if (!fs.existsSync(envConfigsPath)) return

    // Check if file is readable and writable
    try {
      fs.accessSync(envConfigsPath, fs.constants.R_OK | fs.constants.W_OK)
    } catch (permError: any) {
      throw new ConfigPermissionError(
        `Permission denied accessing configs.json for "${targetEnvId}" at "${envConfigsPath}". ` +
          `Ensure the file has read and write permissions for the server process owner (chmod 600 recommended). ` +
          `Original error: ${permError.message}`,
      )
    }
  }

  /**
   * Loads the target environment configurations for the
   * target-environment located at the given root directory.
   * @param rootDir The root directory of the target environment.
   * @returns The loaded configurations. Returns empty array on errors (logs to targetEnvLogger).
   */
  public static loadConfigs(rootDir: string): TTargetEnvConfig[] {
    // Load environment configurations from JSON file.
    let envConfigsPath = path.join(rootDir, 'configs.json')
    let targetEnvId = path.basename(rootDir)

    try {
      // Check if config file exists
      if (!fs.existsSync(envConfigsPath)) return []

      // Check file permissions
      try {
        fs.accessSync(envConfigsPath, fs.constants.R_OK)
      } catch (permError: any) {
        const errorMsg =
          `Permission denied reading configs.json for "${targetEnvId}" at "${envConfigsPath}". ` +
          `Ensure the file has read permissions for the server process owner (chmod 600 or 644). ` +
          `Error: ${permError.message}`
        targetEnvLogger.error(errorMsg)
        return []
      }

      // Read and parse JSON file
      const fileContent = fs.readFileSync(envConfigsPath, 'utf8')
      let configsJson = JSON.parse(fileContent)

      // Set targetEnvId for each config
      configsJson = TargetEnvConfig.setTargetEnvIds(configsJson, targetEnvId)

      // Validate with Zod schema
      const validatedConfigs = TargetEnvConfig.arraySchema.parse(configsJson)

      // Convert validated JSON to TTargetEnvConfig format
      const environmentConfigs: TTargetEnvConfig[] = validatedConfigs.map(
        (configJson) => ({
          _id: configJson._id,
          name: configJson.name,
          targetEnvId: configJson.targetEnvId,
          description: configJson.description ?? '',
          data: configJson.data,
        }),
      )

      return environmentConfigs
    } catch (error: any) {
      // For Zod validation errors, provide detailed feedback
      if (error instanceof zod.ZodError) {
        const issues = error.issues.map((issue) => {
          const path = issue.path.join('.')
          return `  - ${path}: ${issue.message}`
        })
        const errorMsg = `Invalid configs.json structure for "${targetEnvId}" at "${envConfigsPath}":\n${issues.join(
          '\n',
        )}`
        targetEnvLogger.warn(errorMsg)
        return []
      }

      // For JSON parse errors
      if (error instanceof SyntaxError) {
        const errorMsg = `Failed to parse configs.json for "${targetEnvId}" at "${envConfigsPath}": ${error.message}`
        targetEnvLogger.warn(errorMsg)
        return []
      }

      // For other errors, log and return empty
      const errorMsg = `Unexpected error loading configs for "${targetEnvId}" at "${envConfigsPath}": ${error.message}`
      targetEnvLogger.error(errorMsg, error)
      return []
    }
  }

  /**
   * Loads a target schema for the target located at the given path.
   * @param targetPath The path to the target schema file.
   * @returns The loaded {@link TargetSchema} instance.
   */
  public loadTarget(targetPath: string): TargetSchema {
    let targetSchema = this.loadModule<TargetSchema>(targetPath)

    // Handle invalid target schema export.
    if (!(targetSchema instanceof TargetSchema)) {
      throw new Error(
        `The module at path "${targetPath}" does not export a valid TargetSchema instance.`,
      )
    }

    return targetSchema
  }

  /**
   * The absolute path to the root directory of the integration folder.
   */
  public static readonly INTEGRATION_ROOT = path.join(
    process.cwd(),
    'integration',
  )

  /**
   * The absolute path to the root directory of the library folder
   * within the integration folder.
   */
  public static readonly LIBRARY_ROOT = path.join(
    TargetEnvSandbox.INTEGRATION_ROOT,
    'library',
  )

  /**
   * The absolute path to the root directory of the target-environments
   * folder within the integration folder.
   */
  public static readonly TARGET_ENV_ROOT = path.join(
    TargetEnvSandbox.INTEGRATION_ROOT,
    'target-env',
  )

  /**
   * The absolute path to the root directory of the shared folder.
   */
  public static readonly SHARED_ROOT = path.join(process.cwd(), 'shared')

  /**
   * The absolute path to the root directory of the server folder.
   */
  public static readonly SERVER_ROOT = path.join(process.cwd(), 'server')

  /**
   * The absolute path to the root directory of the installed
   * NPM packages (node_modules).
   */
  public static readonly NODE_MODULES_ROOT = path.join(
    process.cwd(),
    'node_modules',
  )

  /**
   * The absolute path to the tsconfig.json file used for
   * target environment module loading.
   */
  public static readonly TSCONFIG_PATH = path.join(
    TargetEnvSandbox.TARGET_ENV_ROOT,
    'tsconfig.json',
  )

  /**
   * The parsed tsconfig.json used for target environment
   * module loading.
   */
  public static readonly TSCONFIG = require(TargetEnvSandbox.TSCONFIG_PATH)

  /**
   * Arguments used for tsconfig-paths registration
   * during target-environment module loading.
   */
  public static tsconfigPathArgs: RegisterParams | undefined

  /**
   * Determines and sets the tsconfig path arguments
   * for the {@link TargetEnvSandbox} class.
   */
  private static determineTsConfigPaths(): void {
    // Load tsconfig-paths arguments.
    const tsconfigPath = path.join(
      TargetEnvSandbox.TARGET_ENV_ROOT,
      'tsconfig.json',
    )
    const tsconfig = require(tsconfigPath)
    const baseUrlResolved = path.resolve(
      path.dirname(tsconfigPath),
      tsconfig.compilerOptions.baseUrl,
    )

    TargetEnvSandbox.tsconfigPathArgs = {
      baseUrl: baseUrlResolved,
      paths: {
        ...tsconfig.compilerOptions.paths,
      },
    }
  }

  /**
   * Loads the globals used in the target-environment code.
   */
  private static loadGlobals(): void {
    const restoreTsConfig = tsconfigPaths.register(
      TargetEnvSandbox.tsconfigPathArgs,
    )
    require('../../integration/target-env/globals')
    restoreTsConfig()
  }

  /**
   * Initializes the {@link TargetEnvSandbox} class
   * for use.
   */
  public static initialize() {
    this.determineTsConfigPaths()
    this.loadGlobals()
  }

  /**
   * Throws an error with the given message if passing `child`
   * and `parent` to the {@link isPathInside} method returns true.
   * @param child The child path to check.
   * @param parent The parent path to check against.
   * @param message The error message to throw if the condition is met.
   * @throws An error if the child path is inside the parent path.
   */
  private static throwIfInside(child: string, parent: string, message: string) {
    if (TargetEnvSandbox.isPathInside(child, parent)) {
      throw new Error(message)
    }
  }

  /**
   * Verifies whether a given child path is located
   * within a parent path.
   * @param child The child path to check.
   * @param parent The parent path to check against.
   * @returns True if the child path is inside the parent path, false otherwise.
   */
  private static isPathInside(child: string, parent: string): boolean {
    const rel = path.relative(parent, child)
    return !!rel && !rel.startsWith('..') && !path.isAbsolute(rel)
  }
}

/* -- TYPES -- */

/**
 * Internal module type for adding middleware
 * to Node.js module loading.
 */
type InternalModuleType = typeof Module & {
  _load(request: string, parent: NodeJS.Module | null, isMain?: boolean): any
  _resolveFilename(
    request: string,
    parent: NodeJS.Module | null,
    isMain?: boolean,
  ): string
}
