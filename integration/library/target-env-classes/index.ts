import fs from 'fs'
import { TTargetEnvJson } from 'metis/target-environments'
import path from 'path'

/**
 * Defines a target environment.
 */
export default class TargetEnvSchema implements TTargetEnvJson {
  /**
   * The ID of the target environment.
   */
  private id: TTargetEnvJson['_id']
  public get _id(): TTargetEnvJson['_id'] {
    return this.id
  }

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
   * Determines if the ID of the target environment can be updated.
   */
  private _canUpdateId: boolean
  /**
   * Determines if the ID of the target environment can be updated.
   */
  public get canUpdateId(): boolean {
    return this._canUpdateId
  }

  /**
   * @param data The data used to define the target environment.
   */
  public constructor(data: TTargetEnv) {
    this.id = ''
    this._name = data.name
    this._description = data.description
    this._version = data.version
    this._targets = []
    this._canUpdateId = true
  }

  /**
   * Sets the ID of the target environment.
   * @param filePath The path to the target environment file.
   */
  public setId(filePath: string) {
    if (!this.canUpdateId) {
      throw new Error(
        "The target environment's ID has already been set and cannot be updated.",
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
 * Defines the target environment data.
 */
type TTargetEnv = Omit<TTargetEnvJson, 'targets' | '_id'>
