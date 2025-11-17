import Module from 'node:module'
import path from 'node:path'
import { Worker } from 'node:worker_threads'
import * as tsconfigPaths from 'tsconfig-paths'
import type { RegisterParams } from 'tsconfig-paths/lib/register'
import type {
  TargetScriptContext,
  TTargetScriptSerializedContext,
} from './context/TargetScriptContext'
import { TargetEnvSchema } from './schema/TargetEnvSchema'
import { TargetSchema } from './schema/TargetSchema'
import type { ServerTarget } from './ServerTarget'

/**
 * Sandboxes modules loaded from target environments
 * to restrict import paths to permitted locations.
 */
export class TargetEnvSandbox {
  /**
   * Restores an active tsconfig-paths registration.
   * If no registration is active, this is a no-op.
   */
  public restoreTsConfig = () => {}

  /**
   * The ID of the target environment associated with
   * this sandbox.
   */
  public get environmentId(): string {
    return path.basename(this.rootDir)
  }

  public constructor(
    /**
     * The root directory of the target environment.
     */
    public rootDir: string,
  ) {}

  /**
   * Activates the sandbox. Call {@link deactivate} to
   * restore normal behavior.
   * @throws An error if another sandbox is already active.
   */
  public activate(): void {
    if (TargetEnvSandbox.activeSandbox) {
      throw new Error(
        `A TargetEnvSandbox is already active for the target environment at "${TargetEnvSandbox.activeSandbox.rootDir}". Only one sandbox can be active at a time.`,
      )
    }

    // Mark this sandbox as active and set up
    // tsconfig-paths.
    TargetEnvSandbox._activeSandbox = this
    this.restoreTsConfig = tsconfigPaths.register(
      TargetEnvSandbox.tsconfigPathArgs,
    )
  }

  /**
   * Deactivates the sandbox, restoring normal
   * behavior to that outside the sandbox.
   * @throws An error if this sandbox is not the
   * active sandbox.
   */
  public deactivate(): void {
    if (TargetEnvSandbox.activeSandbox !== this) {
      throw new Error(
        `Cannot deactivate TargetEnvSandbox for "${this.rootDir}" because it is not the active sandbox.`,
      )
    }

    // Restore tsconfig-paths and clear active sandbox.
    this.restoreTsConfig()
    TargetEnvSandbox._activeSandbox = null
  }

  public executeTargetScript(
    target: ServerTarget,
    context: TargetScriptContext,
  ): Promise<void> {
    if (target.environmentId !== this.environmentId) {
      throw new Error(
        `Cannot execute target script for target "${target.name}" because it belongs to a different target environment ("${target.environmentId}") than the active sandbox ("${this.environmentId}").`,
      )
    }

    return new Promise((resolve, reject) => {
      let workerPath = path.join(
        TargetEnvSandbox.INTEGRATION_ROOT,
        'workers/create-worker.loader.cjs',
      )
      let workerData: TTargetEnvWorkerData = {
        operation: 'execute-target-script',
        schemaPath: target.schemaPath,
        context: {} as any,
      }
      let worker = new Worker(workerPath, {
        workerData,
      })

      worker.on('message', (message) => {
        if (message.type === 'result') {
          if (message.success) {
            resolve(message.result)
          } else {
            const error = new Error(message.error.message)
            error.stack = message.error.stack
            reject(error)
          }
        } else if (message.type === 'callback') {
          const { method, args } = message
          // @ts-expect-error - Spreading callback args from worker message
          context[method](...args)
        }
      })

      worker.on('error', reject)
      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`))
        }
      })
    })
  }

  /**
   * Executes the given script within the sandbox.
   * @param script The script to execute.
   * @returns The result of the script execution.
   * @note This method is deprecated in favor of Worker-based execution.
   * Use {@link loadEnvironmentSchema} or {@link loadTargetSchema} instead.
   * @deprecated
   */
  public execute<TReturn, TArgs extends Array<any>>(
    script: (...args: TArgs) => TReturn,
    ...args: TArgs
  ): TReturn {
    // Activate the sandbox.
    this.activate()

    // Call the function passed, storing
    // the returned value.
    let result = script(...args)

    // If the result is a promise, ensure
    // the sandbox is deactivated when
    // the promise settles.
    if (result instanceof Promise) {
      result.finally(() => {
        this.deactivate()
      })
    }
    // Else, deactivate the sandbox
    // immediately.
    else {
      this.deactivate()
    }

    // Return the result, promise or no
    // promise.
    return result
  }

  /**
   * Loads the target environment schema for the
   * target-environment located at the root directory.
   * @returns The loaded {@link TargetEnvSchema} instance.
   */
  public loadEnvironmentSchema(): TargetEnvSchema {
    let environmentPath = path.join(this.rootDir, 'schema.ts')
    // Load the environment schema within the sandbox.
    let environmentSchema = this.execute(() => require(environmentPath).default)

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
  public loadTargetSchema(targetPath: string): TargetSchema {
    // Load the target schema within the sandbox.
    let targetSchema = this.execute(() => require(targetPath).default)

    // Handle invalid target schema export.
    if (!(targetSchema instanceof TargetSchema)) {
      throw new Error(
        `The module at path "${targetPath}" does not export a valid TargetSchema instance.`,
      )
    }
    if (targetSchema.canUpdateId) {
      targetSchema._id = path.basename(path.dirname(targetPath))
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
   * Internal reference to native Node.js Module
   * class which forcibly exposes private methods
   * which are overridden during sandboxing.
   */
  private static Module = Module as InternalModuleType

  /**
   * Arguments used for tsconfig-paths registration
   * during target-environment module loading.
   */
  public static tsconfigPathArgs: RegisterParams | undefined

  /**
   * @see {@link activeSandbox}
   */
  private static _activeSandbox: TargetEnvSandbox | null = null

  /**
   * Tracks the currently active sandbox, if any.
   */
  public static get activeSandbox(): TargetEnvSandbox | null {
    return this._activeSandbox
  }

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

  private static overrideLoad(): void {
    let originalLoad = TargetEnvSandbox.Module._load

    TargetEnvSandbox.Module._load = function (
      request: string,
      parent: NodeJS.Module | null,
      isMain?: boolean,
    ) {
      if (TargetEnvSandbox.activeSandbox) {
        let { rootDir } = TargetEnvSandbox.activeSandbox
        let targetEnvId = path.basename(rootDir)

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
          requestAbsolutePath = TargetEnvSandbox.Module._resolveFilename(
            request,
            parent ?? null,
            false,
          )
        } catch {
          throw new Error(
            `Module resolution failed for "${request}". Plugins can only import from their own files, integration/library (@metis/*), or Node.js built-in modules.`,
          )
        }

        // Further determine details concerning the import
        // location.
        let parentFilename = parent?.filename
        let isParentInEnv =
          parentFilename &&
          TargetEnvSandbox.isPathInside(parentFilename, rootDir)
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
      } else {
        return originalLoad(request, parent, isMain)
      }
    }
  }

  /**
   * Initializes the {@link TargetEnvSandbox} class
   * for use.
   */
  public static initialize() {
    this.determineTsConfigPaths()
    this.loadGlobals()
    this.overrideLoad()
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

/**
 * Data provided to a target-environment worker
 * when the requested operation is to execute a target
 * script.
 */
export type TTargetScriptWorkerData = {
  /**
   * The operation that the worker should perform.
   */
  readonly operation: 'execute-target-script'
  /**
   * The path to the schema that exports the target script.
   */
  readonly schemaPath: string
  /**
   * The context to provide to the target script.
   */
  readonly context: TTargetScriptSerializedContext
}

/**
 * The data provided to a target-environment worker.
 */
export type TTargetEnvWorkerData = TTargetScriptWorkerData
