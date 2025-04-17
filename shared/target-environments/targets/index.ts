import { AnyObject } from 'metis/toolbox/objects'
import { TTargetEnv } from '..'
import { TMetisBaseComponents } from '../..'
import { TTargetEnvExposedContext } from '../../../server/target-environments/context'
import Arg, { TTargetArg, TTargetArgJson } from '../args'
import blockNode from './block-node'
import output from './output'
import processTimeMod from './process-time-mod'
import resourceCostMod from './resource-cost-mod'
import resourcePool from './resource-pool'
import successChanceMod from './success-chance-mod'

/**
 * This is an entity that can be found in a target environment.
 */
export default abstract class Target<
  T extends TMetisBaseComponents = TMetisBaseComponents,
> {
  /**
   * The environment in which the target exists.
   */
  public environment: TTargetEnv<T>

  /**
   * The ID of the target environment.
   */
  public environmentId(): string {
    return this.environment._id
  }

  /**
   * The ID of the target.
   */
  public _id: string

  /**
   * The name of the target.
   */
  public name: string

  /**
   * Describes what the target is.
   */
  public description: string

  /**
   * The function used to execute an effect on the target.
   */
  public script: TTargetScript

  /**
   * The arguments used to create the effect on the target.
   */
  public args: TTargetArg[]

  /**
   * Creates a new Target Object.
   * @param environment The environment in which the target exists.
   * @param data The data to use to create the Target.
   */
  public constructor(
    environment: TTargetEnv<T>,
    data: Partial<TTargetJson> = Target.DEFAULT_PROPERTIES,
  ) {
    this.environment = environment
    this._id = data._id ?? Target.DEFAULT_PROPERTIES._id
    this.name = data.name ?? Target.DEFAULT_PROPERTIES.name
    this.description = data.description ?? Target.DEFAULT_PROPERTIES.description
    this.script = data.script ?? Target.DEFAULT_PROPERTIES.script
    this.args = Arg.fromJson(data.args ?? Target.DEFAULT_PROPERTIES.args)
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
      script: this.script,
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
    script: async () => {},
    args: [],
  }

  /**
   * The internal targets that are available in the METIS target environment.
   */
  public static readonly INTERNAL_TARGETS: TTargetJson[] = [
    blockNode,
    successChanceMod,
    processTimeMod,
    resourceCostMod,
    output,
    resourcePool,
  ]

  /**
   * A type guard that checks if the provided value is a Target JSON object.
   * @param obj The object to check.
   * @param excludedProperties The properties to exclude when checking if the value is a Target JSON object.
   * @returns True if the value is a Target JSON object.
   */
  public static isJson(
    obj: AnyObject,
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

/* ------------------------------ TARGET TYPES ------------------------------ */

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
   * The function used to execute an effect on the target.
   */
  script: (
    /**
     * The context for the target environment.
     */
    context: TTargetEnvExposedContext,
  ) => Promise<void>
  /**
   * The arguments used to create the effect on the target.
   */
  args: TTargetArgJson[]
}
