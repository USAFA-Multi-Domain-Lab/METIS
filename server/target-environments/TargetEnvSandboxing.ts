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
import ts from 'typescript'
import { z as zod } from 'zod'
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
          `Ensure the file has read permissions for the server process owner. ` +
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
   * The type errors found during the last type check, keyed by the
   * ID of the target environment the file they were found in belongs to.
   */
  private static typeCheckDiagnosticRegistry = new Map<
    string,
    ts.Diagnostic[]
  >()

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
   * Type checks every file covered by the target-environment tsconfig,
   * recording the errors found against the target environment that owns
   * the file each one came from.
   * @note Errors that belong to no target environment are logged instead.
   * @throws If the target-environment tsconfig cannot be read or parsed.
   */
  private static typeCheckEnvironments(): void {
    // Read the tsconfig. This parses the file's text and nothing else:
    // "extends" is not followed and "include" is not expanded yet.
    let configFile = ts.readConfigFile(
      TargetEnvSandboxing.TSCONFIG_PATH,
      ts.sys.readFile,
    )

    // The tsconfig ships with METIS and no target environment can affect
    // it, so a problem with it is a problem with the installation. Crash
    // rather than carry on, which would leave every environment unchecked.
    if (configFile.error) {
      throw new Error(
        `Failed to read "${TargetEnvSandboxing.TSCONFIG_PATH}".\n\n` +
          TargetEnvSandboxing.formatDiagnostics([configFile.error]),
      )
    }

    // Turn that text into a real compile job, doing what running
    // "tsc -p" on the file would do: follow "extends" into the base
    // config, expand "include" into an actual list of files, and resolve
    // "baseUrl" and "paths". Produces the root files and the options.
    let parsedConfig = ts.parseJsonConfigFileContent(
      configFile.config,
      ts.sys,
      path.dirname(TargetEnvSandboxing.TSCONFIG_PATH),
      undefined,
      TargetEnvSandboxing.TSCONFIG_PATH,
    )

    // Unlike the read above, this catches a broken "extends" path, an
    // invalid compiler option, or an "include" that matches no files.
    // Those are installation problems too, so they crash as well.
    if (parsedConfig.errors.length) {
      throw new Error(
        `Failed to parse "${TargetEnvSandboxing.TSCONFIG_PATH}".\n\n` +
          TargetEnvSandboxing.formatDiagnostics(parsedConfig.errors),
      )
    }

    // Build the program from those roots, which also pulls in everything
    // they import, then check the whole of it in one pass. Target
    // environments reach into shared/ and server/, so the graph covers
    // far more than the environment folders themselves.
    let program = ts.createProgram(parsedConfig.fileNames, parsedConfig.options)
    let diagnostics = ts.getPreEmitDiagnostics(program)

    // Errors that cannot be blamed on any one target environment.
    let unownedDiagnostics: ts.Diagnostic[] = []

    // Sort every error into the environment whose folder holds the file
    // it was reported against.
    for (let diagnostic of diagnostics) {
      // Only errors stop an environment from loading. Warnings and
      // suggestions are left alone.
      if (diagnostic.category !== ts.DiagnosticCategory.Error) continue

      // An error can land on a file that belongs to no environment, such
      // as one in shared/ or the target-env globals file, and an error
      // about the compiler options themselves names no file at all.
      let environmentId = diagnostic.file
        ? TargetEnvSandboxing.resolveTargetEnvironmentId(
            diagnostic.file.fileName,
          )
        : null

      if (environmentId === null) {
        unownedDiagnostics.push(diagnostic)
        continue
      }

      // Add the error to that environment's list, which the scan reads
      // back through getTypeErrors as it loads each environment.
      let environmentDiagnostics =
        TargetEnvSandboxing.typeCheckDiagnosticRegistry.get(environmentId)

      if (environmentDiagnostics) {
        environmentDiagnostics.push(diagnostic)
      } else {
        TargetEnvSandboxing.typeCheckDiagnosticRegistry.set(environmentId, [
          diagnostic,
        ])
      }
    }

    // There is no environment to skip over these, so they are only
    // reported.
    if (unownedDiagnostics.length) {
      targetEnvLogger.warn(
        `Type errors were found outside of any target environment:\n\n` +
          TargetEnvSandboxing.formatDiagnostics(unownedDiagnostics),
      )
    }
  }

  /**
   * @param targetEnvironmentId The ID of the target environment to report on.
   * @returns The type errors found in the target environment, formatted for
   * display, or null if it has none.
   */
  public static getTypeErrors(targetEnvironmentId: string): string | null {
    let diagnostics =
      TargetEnvSandboxing.typeCheckDiagnosticRegistry.get(targetEnvironmentId)

    if (!diagnostics || !diagnostics.length) return null

    return TargetEnvSandboxing.formatDiagnostics(diagnostics)
  }

  /**
   * @param diagnostics The diagnostics to format.
   * @returns The diagnostics rendered as displayable text, one per
   * paragraph.
   */
  private static formatDiagnostics(
    diagnostics: readonly ts.Diagnostic[],
  ): string {
    let host: ts.FormatDiagnosticsHost = {
      getCanonicalFileName: (fileName) => fileName,
      getCurrentDirectory: ts.sys.getCurrentDirectory,
      getNewLine: () => ts.sys.newLine,
    }

    // Format one at a time and separate them with a blank line. Handing
    // the whole set over at once runs them together into a block that is
    // hard to read, especially where a diagnostic spans several lines.
    return diagnostics
      .map((diagnostic) => ts.formatDiagnostics([diagnostic], host))
      .join(ts.sys.newLine)
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
      let targetEnvironmentId = TargetEnvSandboxing.resolveTargetEnvironmentId(
        parent.filename,
      )

      if (targetEnvironmentId === null) {
        return next()
      }

      let rootDir = path.join(
        TargetEnvSandboxing.TARGET_ENV_ROOT,
        targetEnvironmentId,
      )

      // Allow Node.js built-in modules (they don't resolve to file paths)
      if (
        Module.builtinModules.includes(request) ||
        request.startsWith('node:')
      ) {
        return next()
      }
      // Resolve if the request is a non-relative import
      // inside the target environment.
      if (
        request === targetEnvironmentId ||
        request.startsWith(`${targetEnvironmentId}/`)
      ) {
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
    TargetEnvSandboxing.typeCheckEnvironments()
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
   * Determines which target environment owns a given file.
   * @param filePath The path to the file.
   * @returns The ID of the target environment containing the file, or null
   * if the file sits outside every target environment.
   */
  private static resolveTargetEnvironmentId(filePath: string): string | null {
    if (
      !TargetEnvSandboxing.isPathInside(
        filePath,
        TargetEnvSandboxing.TARGET_ENV_ROOT,
      )
    ) {
      return null
    }

    let segments = path
      .relative(TargetEnvSandboxing.TARGET_ENV_ROOT, filePath)
      .split(path.sep)

    return segments.length > 1 ? segments[0] : null
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
