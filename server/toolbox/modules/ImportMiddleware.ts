import Module from 'node:module'

/**
 * Static class allowing the definition of import middleware,
 * which will run before an import is resolved by Node.
 */
export abstract class ImportMiddleware {
  /**
   * Internal reference to native Node.js Module
   * class which forcibly exposes private methods
   * which are used by middleware.
   */
  private static MetisModule = Module as MetisModule

  /**
   * Callbacks that will run when a module is imported.
   */
  private static middlewares: TImportMiddleware[] = []

  /**
   * Whether the import middleware system
   * has been initialized.
   */
  private static initialized = false

  /**
   * Initializes the import middleware system for use.
   */
  private static initialize(): void {
    let originalLoad = ImportMiddleware.MetisModule._load

    // Override the module load function,
    // injecting the middleware.
    ImportMiddleware.MetisModule._load = function (
      request: string,
      parent: NodeJS.Module | null,
      isMain?: boolean,
    ) {
      let operations = [...ImportMiddleware.middlewares]

      // Calls all the middlewares in sequence.
      const algorithm = () => {
        let operation = operations.shift()

        if (operation) {
          operation(request, parent, algorithm)
        }
      }
      algorithm()

      // Finally, call the original module load function.
      return originalLoad(request, parent, isMain)
    }
    ImportMiddleware.initialized = true
  }

  /**
   * Adds middleware that will run when a module is imported.
   * @param middleware The middleware to add.
   */
  public static add(middleware: TImportMiddleware): void {
    if (!ImportMiddleware.initialized) ImportMiddleware.initialize()
    ImportMiddleware.middlewares.push(middleware)
  }

  /**
   * Removes the specified middleware.
   * @param middleware The middleware to remove.
   */
  public static remove(middleware: TImportMiddleware): void {
    ImportMiddleware.middlewares = ImportMiddleware.middlewares.filter(
      (m) => m !== middleware,
    )
  }

  /**
   * Resolves the filename for a module request.
   * @param request The module request string.
   * @param parent The parent module.
   * @returns The resolved filename.
   */
  public static resolveFilename(
    request: string,
    parent: NodeJS.Module | null,
  ): string {
    return ImportMiddleware.MetisModule._resolveFilename(
      request,
      parent ?? null,
      false,
    )
  }
}

/* -- TYPES -- */

/**
 * A callback function that runs when a module is imported.
 * @param request The module request string.
 * @param parent The parent module.
 * @param next A callback that must be called to continue
 * the import process.
 */
export type TImportMiddleware = (
  request: string,
  parent: NodeJS.Module | null,
  next: () => void,
) => void

/**
 * Internal module type for adding middleware
 * to Node.js module loading.
 */
type MetisModule = typeof Module & {
  _load(request: string, parent: NodeJS.Module | null, isMain?: boolean): any
  _resolveFilename(
    request: string,
    parent: NodeJS.Module | null,
    isMain?: boolean,
  ): string
}
