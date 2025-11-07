import type { TTargetEnvExposedContext } from '../../../server/target-environments/TargetEnvContext'
import { MetisComponent } from '../../MetisComponent'
import type { TAnyObject } from '../../toolbox/objects/ObjectToolbox'
import type { TTargetArg, TTargetArgJson } from '../args/Arg'
import { Arg } from '../args/Arg'
import type { TTargetEnv } from '../TargetEnvironment'

/**
 * This is an entity that can be found in a target environment.
 */
export abstract class Target<
  T extends TMetisBaseComponents = TMetisBaseComponents,
> extends MetisComponent {
  /**
   * The ID of the target environment.
   */
  public environmentId(): string {
    return this.environment._id
  }

  /**
   * The latest version of the target environment
   * for which the target has a migration script.
   */
  public get latestMigratableVersion(): string | undefined {
    return this.migrationVersions[this.migrationVersions.length - 1]
  }

  /**
   * The versions of the target environment for which
   * the target has a migration script.
   */
  public abstract get migrationVersions(): string[]

  protected constructor(
    _id: string,
    name: string,
    /**
     * Describes what the target is.
     */
    public description: string,

    /**
     * The arguments used to create the effect on the target.
     */
    public args: TTargetArg[],
    /**
     * The environment in which the target exists.
     */
    public environment: TTargetEnv<T>,
  ) {
    super(_id, name, false)

    this.description = description
    this.args = args
    this.environment = environment
  }

  /**
   * Converts the Target Object to JSON.
   * @param options Options for converting the Target to JSON.
   * @returns A JSON representation of the Target.
   */
  public toJson(): TTargetJson {
    // Construct JSON object to send to the server.
    return {
      targetEnvId: this.environment._id,
      _id: this._id,
      name: this.name,
      description: this.description,
      migrationVersions: this.migrationVersions,
      args: Arg.toJson(this.args),
    }
  }

  /**
   * Default properties set when creating a new Target object.
   */
  public static readonly DEFAULT_PROPERTIES: TTargetJson = {
    targetEnvId: 'metis-target-env-default',
    _id: 'metis-target-default',
    name: 'Select a target',
    description: 'This is a default target.',
    migrationVersions: [],
    args: [],
  }

  /**
   * The target IDs for the METIS target environment.
   */
  public static METIS_TARGET_IDS = {
    AWARD: 'award',
    BLOCK_STATUS: 'block-status',
    DELAY: 'delay',
    FILE_ACCESS: 'file-access',
    OPEN_NODE_STATE: 'open-state',
    OUTPUT: 'output',
    PROCESS_TIME_MOD: 'process-time-mod',
    RESOURCE_COST_MOD: 'resource-cost-mod',
    SUCCESS_CHANCE_MOD: 'success-chance-mod',
  }

  /**
   * A type guard that checks if the provided value is a Target JSON object.
   * @param obj The object to check.
   * @param excludedProperties The properties to exclude when checking if the value is a Target JSON object.
   * @returns True if the value is a Target JSON object.
   */
  public static isJson(
    obj: TAnyObject,
    excludedKeys: (keyof TTargetJson)[] = [],
  ): obj is TTargetJson {
    // Only grab the keys that are not excluded.
    const requiredKeys = Object.keys(Target.DEFAULT_PROPERTIES).filter(
      (key) => !excludedKeys.includes(key as keyof TTargetJson),
    )
    // Check if the required keys are present in the object.
    const keysPassed = Object.keys(obj)
    return keysPassed.every((key) => requiredKeys.includes(key))
  }
}

/* -- TYPES -- */

/**
 * Options for creating a new Target Object.
 */
export type TTargetOptions = {}

/**
 * Options for converting the TargetEnvironment to JSON.
 */
export type TTargetJsonOptions = {}

/**
 * A valid script that can be executed on a target.
 */
export type TTargetScript = (
  /**
   * The context for the target environment.
   */
  context: TTargetEnvExposedContext,
) => Promise<void>

/**
 * Extracts the target type from a registry of METIS
 * components type that extends `TMetisBaseComponents`.
 * @param T The type registry.
 * @returns The target type.
 */
export type TTarget<T extends TMetisBaseComponents> = T['target']

/**
 * The JSON representation of a Target Object.
 */
export interface TTargetJson {
  /**
   * The ID of the target environment.
   */
  targetEnvId: string
  /**
   * The ID of the target.
   */
  _id: string
  /**
   * The name of the target.
   */
  name: string
  /**
   * Describes what the target is.
   */
  description: string
  /**
   * The arguments used to create the effect on the target.
   */
  args: TTargetArgJson[]
  /**
   * Target environment versions for the target for which
   * the target has a migration script.
   */
  migrationVersions: string[]
}
