import { TCommonTargetEnvJson } from 'metis/target-environments'

/**
 * Defines a target environment.
 */
export default class TargetEnvSchema implements TCommonTargetEnvJson {
  // Implemented
  public _id: TCommonTargetEnvJson['_id'] = ''

  /**
   * The name of the target environment.
   */
  private _name: TCommonTargetEnvJson['name']
  public get name(): TCommonTargetEnvJson['name'] {
    return this._name
  }

  /**
   * Describes what the target environment is.
   */
  private _description: TCommonTargetEnvJson['description']
  public get description(): TCommonTargetEnvJson['description'] {
    return this._description
  }

  /**
   * The current version of the target environment.
   */
  private _version: TCommonTargetEnvJson['version']
  public get version(): TCommonTargetEnvJson['version'] {
    return this._version
  }

  // Implemented
  public targets: TCommonTargetEnvJson['targets'] = []

  /**
   * @param data The data used to define the target environment.
   */
  public constructor(data: TTargetEnv) {
    this._name = data.name
    this._description = data.description
    this._version = data.version
  }
}

/**
 * Defines the target environment data.
 */
type TTargetEnv = Omit<TCommonTargetEnvJson, 'targets' | '_id'>
