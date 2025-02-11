import fs from 'fs'
import { TCommonTargetJson } from 'metis/target-environments/targets'
import path from 'path'

/**
 * Defines a target.
 */
export default class TargetSchema implements TCommonTargetJson {
  /**
   * The ID of the target.
   */
  private id: TCommonTargetJson['_id']
  public get _id(): TCommonTargetJson['_id'] {
    return this.id
  }

  /**
   * The ID of the target environment.
   */
  private _targetEnvId: TCommonTargetJson['targetEnvId']
  public get targetEnvId(): TCommonTargetJson['targetEnvId'] {
    return this._targetEnvId
  }
  public set targetEnvId(targetEnvId: TCommonTargetJson['targetEnvId']) {
    if (this.canUpdateTargetEnvId) {
      this._targetEnvId = targetEnvId
      this._canUpdateTargetEnvId = false
    } else {
      throw new Error(
        'Target environment ID has already been set and cannot be updated.',
      )
    }
  }

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
   * Determines if the ID of the target can be updated.
   */
  private _canUpdateId: boolean
  /**
   * Determines if the ID of the target can be updated.
   */
  public get canUpdateId(): boolean {
    return this._canUpdateId
  }

  /**
   * Determines if the target environment ID can be updated.
   */
  private _canUpdateTargetEnvId: boolean
  /**
   * Determines if the target environment ID can be updated.
   */
  public get canUpdateTargetEnvId(): boolean {
    return this._canUpdateTargetEnvId
  }

  /**
   * @param data The data used to define the target.
   */
  public constructor(data: TTargetData) {
    this.id = ''
    this._targetEnvId = ''
    this._name = data.name
    this._description = data.description
    this._script = data.script
    this._args = data.args
    this._canUpdateId = true
    this._canUpdateTargetEnvId = true
  }

  /**
   * Sets the ID of the target.
   * @param filePath The path to the target file.
   */
  public setId(filePath: string) {
    if (!this.canUpdateId) {
      throw new Error(
        "The target's ID has already been set and cannot be updated.",
      )
    }

    const isValid =
      fs.existsSync(filePath) && fs.lstatSync(filePath).isDirectory()

    if (isValid) {
      this.id = path.basename(filePath)
      this._canUpdateId = false
    } else {
      throw new Error('Invalid path provided.')
    }
  }
}

/**
 * Defines the target data.
 */
type TTargetData = Omit<TCommonTargetJson, '_id' | 'targetEnvId'>
