import fs from 'fs'
import type {
  TTargetArgJson,
  TTargetJson,
  TTargetScript,
} from 'metis/target-environments'
import { TargetMigrationRegistry } from 'metis/target-environments'
import path from 'path'

/**
 * Defines a target.
 */
export class TargetSchema {
  /**
   * The ID of the target.
   */
  private id: string
  public get _id(): string {
    return this.id
  }

  /**
   * The ID of the target environment.
   */
  private _targetEnvId: string
  public get targetEnvId(): string {
    return this._targetEnvId
  }
  public set targetEnvId(targetEnvId: string) {
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
  private _name: string
  public get name(): string {
    return this._name
  }

  /**
   * Describes what the target is.
   */
  private _description: string
  public get description(): string {
    return this._description
  }

  /**
   * The function used to execute an effect on the target.
   */
  private _script: TTargetScript
  public get script(): TTargetScript {
    return this._script
  }

  /**
   * The arguments used to create the effect on the target.
   */
  private _args: TTargetArgJson[]
  public get args(): TTargetArgJson[] {
    return this._args
  }

  /**
   * Registry of migrations used to migrate outdated effects
   * to the latest version of the target environment.
   */
  public migrationRegistry: TargetMigrationRegistry

  // Implemented
  public get migrationVersions(): string[] {
    return Object.keys(this.migrationRegistry.versions)
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
   * @param options The data used to define the target.
   */
  public constructor(options: TTargetSchemaOptions) {
    this.id = ''
    this._targetEnvId = ''
    this._name = options.name
    this._description = options.description
    this._script = options.script
    this._args = options.args
    this._canUpdateId = true
    this._canUpdateTargetEnvId = true
    this.migrationRegistry = options.migrations ?? new TargetMigrationRegistry()
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
interface TTargetSchemaOptions
  extends Omit<TTargetJson, '_id' | 'targetEnvId' | 'migrationVersions'> {
  /**
   * The script which will enact the effect on the target.
   */
  script: TTargetScript
  /**
   * @see {@link TargetSchema.migrationRegistry}
   */
  migrations?: TargetMigrationRegistry
}
