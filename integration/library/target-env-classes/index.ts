import type { TTargetEnvJson } from 'metis/target-environments'
import type { TTargetEnvMethods } from '../../../server/target-environments'
import { TargetEnvironmentHook } from '../../../server/target-environments'
import { getCallerFolder } from '../toolbox/files'

/**
 * Defines a target environment.
 */
export class TargetEnvSchema {
  /**
   * A registry of hooks associated with the target environment.
   */
  private _hooks: TargetEnvironmentHook[]

  /**
   * @see {@link TargetEnvSchema._hooks}
   * @note Returns the copy, not the original array.
   */
  public get hooks(): TargetEnvironmentHook[] {
    return [...this._hooks]
  }

  /**
   * The ID of the target environment.
   */
  public readonly _id: TTargetEnvJson['_id']

  /**
   * The name of the target environment.
   */
  private _name: TTargetEnvJson['name']
  public get name(): TTargetEnvJson['name'] {
    return this._name
  }

  /**
   * Describes what the target environment is.
   */
  private _description: TTargetEnvJson['description']
  public get description(): TTargetEnvJson['description'] {
    return this._description
  }

  /**
   * The current version of the target environment.
   */
  private _version: TTargetEnvJson['version']
  public get version(): TTargetEnvJson['version'] {
    return this._version
  }

  /**
   * The JSON representation of the targets in the environment.
   */
  private _targets: TTargetEnvJson['targets']
  public get targets(): TTargetEnvJson['targets'] {
    return this._targets
  }

  /**
   * @param data The data used to define the target environment.
   */
  public constructor(options: TTargetEnvOptions) {
    this._id = getCallerFolder()
    this._name = options.name
    this._description = options.description
    this._version = options.version
    this._targets = []
    this._hooks = []
  }

  /**
   * Adds a hook to the target environment which will call
   * the provided callback when the specified method is invoked.
   * @param method The method for which the callback should be called.
   * @param callback The handler function to call when the method is invoked.
   */
  public on(method: TTargetEnvMethods, callback: () => void | Promise<void>) {
    this._hooks.push(new TargetEnvironmentHook(method, callback))
  }

  /**
   * IDs that cannot be used as target environment IDs.
   */
  public static readonly RESERVED_IDS = ['INFER']
}

/**
 * Options passed to the TargetEnvSchema constructor.
 */
interface TTargetEnvOptions extends Omit<TTargetEnvJson, 'targets' | '_id'> {}
