import { TCommonTargetJson } from 'metis/target-environments/targets'

/**
 * Defines a target.
 */
export default class TargetSchema implements TCommonTargetJson {
  // Implemented
  public _id: TCommonTargetJson['_id'] = ''

  // Implemented
  public targetEnvId: TCommonTargetJson['targetEnvId'] = ''

  /**
   * The name of the target.
   */
  private _name: TCommonTargetJson['name']
  public get name(): TCommonTargetJson['name'] {
    return this._name
  }

  /**
   * Describes what the target is.
   */
  private _description: TCommonTargetJson['description']
  public get description(): TCommonTargetJson['description'] {
    return this._description
  }

  /**
   * The function used to execute an effect on the target.
   */
  private _script: TCommonTargetJson['script']
  public get script(): TCommonTargetJson['script'] {
    return this._script
  }

  /**
   * The arguments used to create the effect on the target.
   */
  private _args: TCommonTargetJson['args']
  public get args(): TCommonTargetJson['args'] {
    return this._args
  }

  /**
   * @param data The data used to define the target.
   */
  public constructor(data: TTargetData) {
    this._name = data.name
    this._description = data.description
    this._script = data.script
    this._args = data.args
  }
}

/**
 * Defines the target data.
 */
type TTargetData = Omit<TCommonTargetJson, '_id' | 'targetEnvId'>
