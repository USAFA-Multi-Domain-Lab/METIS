import Module from 'node:module'
import path from 'node:path'
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

      // First, resolve the request to an absolute filename if possible
      let resolved: string
      try {
        resolved = InternalModule._resolveFilename(
          request,
          parent ?? null,
          false,
        )
      } catch {
        throw new Error(
          `Module resolution failed for "${request}". Plugins can only import from their own files, integration/library (@metis/*), or Node.js built-in modules.`,
        )
      }

      if (!resolved || !path.isAbsolute(resolved)) {
        return resolve()
      }

      // Further determine details concerning the import
      // location.
      let parentFilename = parent?.filename
      let isImportFromLibrary =
        (parentFilename &&
          TargetEnvSandbox.isPathInside(
            parentFilename,
            TargetEnvSandbox.LIBRARY_ROOT,
          )) ||
        TargetEnvSandbox.isPathInside(resolved, TargetEnvSandbox.LIBRARY_ROOT)
      let isImportFromEnv = TargetEnvSandbox.isPathInside(resolved, rootDir)

      // If the import is not from allowed locations, throw an error.
      if (!isImportFromLibrary && !isImportFromEnv) {
        TargetEnvSandbox.throwIfInside(
          resolved,
          TargetEnvSandbox.NODE_MODULES_ROOT,
          `NPM package import blocked: "${request}" -> "${resolved}". Plugins cannot directly import npm packages. Use @metis library exports instead.`,
        )
        TargetEnvSandbox.throwIfInside(
          resolved,
          TargetEnvSandbox.SHARED_ROOT,
          `Shared folder import blocked: "${resolved}". Plugins may not import from @shared; use @metis library exports instead.`,
        )
        TargetEnvSandbox.throwIfInside(
          resolved,
          TargetEnvSandbox.SERVER_ROOT,
          `Server folder import blocked: "${resolved}". Plugins may not import from @server; use @metis library exports instead.`,
        )
        TargetEnvSandbox.throwIfInside(
          resolved,
          TargetEnvSandbox.TARGET_ENV_ROOT,
          `Cross-plugin import blocked: "${resolved}". Plugins may only access their own files or integration/library.`,
        )
        throw new Error(
          `Unauthorized import blocked: "${request}" -> "${resolved}". Plugins may only import from their own files, integration/library (@metis/*), or Node.js built-in modules.`,
        )
      }

      // Resolve the module as normal.
      return resolve()
    }

    try {
      return require(modulePath).default
    } finally {
      InternalModule._load = originalLoad
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
