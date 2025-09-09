import { TTargetEnvJson } from 'metis/target-environments'
import { getCallerFolder } from '../toolbox/files'

/**
 * Defines a target environment.
 */
export default class TargetEnvSchema {
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
