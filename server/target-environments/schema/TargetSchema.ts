import type { TTargetArgJson } from '@shared/target-environments/args/Arg'
import { TargetMigrationRegistry } from '@shared/target-environments/targets/migrations/TargetMigrationRegistry'
import type { TTargetJson } from '@shared/target-environments/targets/Target'
import type { TTargetScriptExposedContext } from '../context/TargetScriptContext'

/**
 * Defines a target.
 */
export class TargetSchema {
  /**
   * The ID of the target.
   */
  public readonly _id: string

  /**
   * @see {@link Target.targetEnvId}
   */
  private _targetEnvId: string
  /**
   * The ID of the target environment.
   */
  public get targetEnvId(): string {
    return this._targetEnvId
  }
  public set targetEnvId(targetEnvId: string) {
    if (!this.canUpdateTargetEnvId) {
      throw new Error(
        'Target environment ID has already been set and cannot be updated.',
      )
    }
    this._targetEnvId = targetEnvId
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
   * Determines if the target environment ID can be updated.
   */
  public get canUpdateTargetEnvId(): boolean {
    return this._targetEnvId === ''
  }

  /**
   * @param options The data used to define the target.
   */
  public constructor(options: TTargetSchemaOptions) {
    this._id = options._id
    this._targetEnvId = ''
    this._name = options.name
    this._description = options.description
    this._script = options.script
    this._args = options.args
    this.migrationRegistry = options.migrations ?? new TargetMigrationRegistry()
  }
}

/* -- TYPES -- */

/**
 * A valid script that can be executed on a target.
 */
export type TTargetScript = (
  /**
   * The context for the target environment.
   */
  context: TTargetScriptExposedContext,
) => Promise<void>

/**
 * Defines the target data.
 */
export interface TTargetSchemaOptions
  extends Omit<TTargetJson, 'targetEnvId' | 'migrationVersions'> {
  /**
   * The script which will enact the effect on the target.
   */
  script: TTargetScript
  /**
   * @see {@link TargetSchema.migrationRegistry}
   */
  migrations?: TargetMigrationRegistry
}
