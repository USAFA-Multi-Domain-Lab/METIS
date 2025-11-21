import { targetEnvLogger } from '@server/logging'
import { ServerFileToolbox } from '@server/toolbox/files/ServerFileToolbox'
import { ImportMiddleware } from '@server/toolbox/modules/ImportMiddleware'
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
export abstract class TargetEnvSandboxing {
  /**
   * Registers the tsconfig-path configuration necessary
   * to load modules found in target environments.
   */
  private static registerTsConfig(): void {
    TargetEnvSandboxing.restoreTsConfig = tsconfigPaths.register(
      TargetEnvSandboxing.tsconfigPathArgs,
    )
  }

  /**
   * Restores an active tsconfig-paths registration.
   * If no registration is active, this is a no-op.
   */
  private static restoreTsConfig: () => void = () => {}

  private static executeWithTsConfig<T, TArgs extends any[]>(
    fn: (...args: TArgs) => T,
    ...args: TArgs
  ): T {
    TargetEnvSandboxing.registerTsConfig()
    try {
      return fn(...args)
    } finally {
      TargetEnvSandboxing.restoreTsConfig()
    }
  }

  /**
   * Validates that configs.json has proper read and write permissions.
   * @param rootDir The root directory of the target environment.
   * @throws ConfigPermissionError if configs.json exists but is not readable or writable.
   */
  private static validateConfigPermissions(rootDir: string): void {
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
   * Loads the target environment schema for the
   * target-environment located at the given path.
   * @param environmentPath The path to the target environment schema file.
   * @returns The loaded {@link TargetEnvSchema} instance.
   */
  public static loadEnvironmentSchema(
    environmentPath: string,
  ): TargetEnvSchema {
    // Validate config permissions on startup (strict mode)
    TargetEnvSandboxing.validateConfigPermissions(path.dirname(environmentPath))

    // Load the target environment schema with the tsconfig-paths
    // registration active.
    let environmentSchema = TargetEnvSandboxing.executeWithTsConfig(
      () => require(environmentPath).default,
    )

    // Handle invalid target schema export.
    if (!(environmentSchema instanceof TargetEnvSchema)) {
      throw new Error(
        `The module at path "${environmentPath}" does not export a valid TargetEnvSchema instance.`,
      )
    }

    return environmentSchema
  }

  /**
   * Loads a target schema for the target located at the given path.
   * @param targetPath The path to the target schema file.
   * @returns The loaded {@link TargetSchema} instance.
   */
  public static loadTargetSchema(targetPath: string): TargetSchema {
    // Load the target schema within the sandbox.
    let targetSchema = TargetEnvSandboxing.executeWithTsConfig(
      () => require(targetPath).default,
    )

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
    TargetEnvSandboxing.INTEGRATION_ROOT,
    'library',
  )

  /**
   * The absolute path to the root directory of the target-environments
   * folder within the integration folder.
   */
  public static readonly TARGET_ENV_ROOT = path.join(
    TargetEnvSandboxing.INTEGRATION_ROOT,
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
    TargetEnvSandboxing.TARGET_ENV_ROOT,
    'tsconfig.json',
  )

  /**
   * The parsed tsconfig.json used for target environment
   * module loading.
   */
  public static readonly TSCONFIG = require(TargetEnvSandboxing.TSCONFIG_PATH)

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
      TargetEnvSandboxing.TARGET_ENV_ROOT,
      'tsconfig.json',
    )
    const tsconfig = require(tsconfigPath)
    const baseUrlResolved = path.resolve(
      path.dirname(tsconfigPath),
      tsconfig.compilerOptions.baseUrl,
    )

    TargetEnvSandboxing.tsconfigPathArgs = {
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
      TargetEnvSandboxing.tsconfigPathArgs,
    )
    require('../../integration/target-env/global')
    restoreTsConfig()
  }

  /**
   * Adds import middleware to control module loading
   * within target environments.
   */
  private static addImportMiddleware(): void {
    ImportMiddleware.add((request, parent, next) => {
      // Immediately resolve if there is no parent module.
      if (!parent) {
        return next()
      }

      // If the parent module is not even in a target environment,
      // allow the load to proceed unimpeded.
      let isParentInEnv =
        parent.filename &&
        TargetEnvSandboxing.isPathInside(
          path.dirname(parent.filename),
          TargetEnvSandboxing.TARGET_ENV_ROOT,
        )
      if (!isParentInEnv) {
        return next()
      }

      // Find the name of the folder directly under
      // the target-environments root which contains
      // the parent module.
      let rootDir = ''
      let targetEnvId = ''
      {
        let currentDir = path.dirname(parent.filename)
        while (true) {
          let parentDir = path.dirname(currentDir)
          if (
            parentDir === TargetEnvSandboxing.TARGET_ENV_ROOT ||
            parentDir === currentDir
          ) {
            rootDir = currentDir
            targetEnvId = path.basename(rootDir)
            break
          }
          currentDir = parentDir
        }
      }

      // Allow Node.js built-in modules (they don't resolve to file paths)
      if (
        Module.builtinModules.includes(request) ||
        request.startsWith('node:')
      ) {
        return next()
      }
      // Resolve if the request is a non-relative import
      // inside the target environment.
      if (request === targetEnvId || request.startsWith(`${targetEnvId}/`)) {
        return next()
      }

      // First, resolve the request to an absolute filename if possible.
      let requestAbsolutePath: string
      try {
        requestAbsolutePath = ImportMiddleware.MetisModule._resolveFilename(
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
      let isRequestInEnv = TargetEnvSandboxing.isPathInside(
        requestAbsolutePath,
        rootDir,
      )
      let isRequestInLibrary = TargetEnvSandboxing.isPathInside(
        requestAbsolutePath,
        TargetEnvSandboxing.LIBRARY_ROOT,
      )

      // If the import is not from allowed locations, throw an error.
      if (isParentInEnv && !isRequestInEnv && !isRequestInLibrary) {
        TargetEnvSandboxing.throwIfInside(
          requestAbsolutePath,
          TargetEnvSandboxing.NODE_MODULES_ROOT,
          `NPM package import blocked: "${request}" -> "${requestAbsolutePath}". Plugins cannot directly import npm packages. Use @metis library exports instead.`,
        )
        TargetEnvSandboxing.throwIfInside(
          requestAbsolutePath,
          TargetEnvSandboxing.SHARED_ROOT,
          `Shared folder import blocked: "${requestAbsolutePath}". Plugins may not import from @shared; use @metis library exports instead.`,
        )
        TargetEnvSandboxing.throwIfInside(
          requestAbsolutePath,
          TargetEnvSandboxing.SERVER_ROOT,
          `Server folder import blocked: "${requestAbsolutePath}". Plugins may not import from @server; use @metis library exports instead.`,
        )
        TargetEnvSandboxing.throwIfInside(
          requestAbsolutePath,
          TargetEnvSandboxing.TARGET_ENV_ROOT,
          `Cross-plugin import blocked: "${requestAbsolutePath}". Plugins may only access their own files or integration/library.`,
        )
        throw new Error(
          `Unauthorized import blocked: "${request}" -> "${requestAbsolutePath}". Plugins may only import from their own files, integration/library (@metis/*), or Node.js built-in modules.`,
        )
      }

      return next()
    })
  }

  /**
   * Overrides global timing functions to enforce sandboxing.
   */
  private static overrideTimingFunctions() {
    Object.defineProperty(globalThis, 'setTimeout', {
      value: TargetEnvSandboxing.sandboxedSetTimeout,
      writable: false,
      configurable: false,
    })
    Object.defineProperty(globalThis, 'setInterval', {
      value: TargetEnvSandboxing.sandboxedSetInterval,
      writable: false,
      configurable: false,
    })
  }

  /**
   * Initializes the {@link TargetEnvSandbox} class
   * for use.
   */
  public static initialize() {
    TargetEnvSandboxing.determineTsConfigPaths()
    TargetEnvSandboxing.loadGlobals()
    TargetEnvSandboxing.addImportMiddleware()
    TargetEnvSandboxing.overrideTimingFunctions()
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
    if (TargetEnvSandboxing.isPathInside(child, parent)) {
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

  /**
   * The original global setTimeout function before
   * sandboxing.
   */
  private static originalSetTimeout = globalThis.setTimeout.bind(globalThis)

  /**
   * A sandboxed version of the global setTimeout function
   * which
   */
  public static sandboxedSetTimeout = (
    ...args: Parameters<typeof setTimeout>
  ) => {
    let callerDirectory = path.dirname(ServerFileToolbox.getCallerFilePath())

    if (
      TargetEnvSandboxing.isPathInside(
        callerDirectory,
        TargetEnvSandboxing.TARGET_ENV_ROOT,
      )
    ) {
      throw new Error(
        `"setTimeout" is restricted in target-environment code. Use the "sleep" function provided in the context instead.`,
      )
    }

    return TargetEnvSandboxing.originalSetTimeout(...args)
  }

  /**
   * The original global setInterval function before
   * sandboxing.
   */
  private static originalSetInterval = globalThis.setInterval.bind(globalThis)

  /**
   * A sandboxed version of the global setInterval function
   * which
   */
  public static sandboxedSetInterval = (
    ...args: Parameters<typeof setInterval>
  ) => {
    let callerDirectory = path.dirname(ServerFileToolbox.getCallerFilePath())

    if (
      TargetEnvSandboxing.isPathInside(
        callerDirectory,
        TargetEnvSandboxing.TARGET_ENV_ROOT,
      )
    ) {
      throw new Error(
        `"setInterval" is restricted in target-environment code. Use the "sleep" function provided in the context instead.`,
      )
    }

    return TargetEnvSandboxing.originalSetInterval(...args)
  }
}
