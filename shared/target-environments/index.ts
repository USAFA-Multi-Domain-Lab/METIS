import { TCommonMissionTypes } from 'metis/missions'
import { AnyObject } from 'metis/toolbox/objects'
import Target, { TTargetJson, TTarget } from './targets'

/**
 * This is the environment in which the target(s) exist.
 */
export default abstract class TargetEnvironment<
  T extends TCommonMissionTypes = TCommonMissionTypes,
> {
  /**
   * The ID of the target environment.
   */
  public _id: string

  /**
   * The name of the target environment.
   */
  public name: string

  /**
   * Describes what the target environment is.
   */
  public description: string

  /**
   * The current version of the target environment.
   */
  public version: string

  /**
   * The targets in the environment.
   */
  public targets: TTarget<T>[]

  /**
   * Creates a new TargetEnvironment Object.
   * @param data The data to use to create the TargetEnvironment.
   */
  public constructor(
    data: Partial<TTargetEnvJson> = TargetEnvironment.DEFAULT_PROPERTIES,
  ) {
    this._id = data._id ?? TargetEnvironment.DEFAULT_PROPERTIES._id
    this.name = data.name ?? TargetEnvironment.DEFAULT_PROPERTIES.name
    this.description =
      data.description ?? TargetEnvironment.DEFAULT_PROPERTIES.description
    this.version = data.version ?? TargetEnvironment.DEFAULT_PROPERTIES.version
    this.targets = this.parseTargets(
      data.targets ?? TargetEnvironment.DEFAULT_PROPERTIES.targets,
    )
  }

  /**
   * Parses the target data into Target Objects.
   * @param data The target data to parse.
   * @returns An array of Target Objects.
   */
  protected abstract parseTargets(data: TTargetJson[]): TTarget<T>[]

  /**
   * Converts the TargetEnvironment Object to JSON.
   * @param options Options for converting the TargetEnvironment to JSON.
   * @returns A JSON representation of the TargetEnvironment.
   */
  public toJson(): TTargetEnvJson {
    // Construct JSON object to send to the server.
    return {
      _id: this._id,
      name: this.name,
      description: this.description,
      version: this.version,
      targets: this.targets.map((target) => target.toJson()),
    }
  }

  /**
   * Checks if the provided value is a TargetEnvironment JSON object.
   * @param obj The object to check.
   * @param excludedProperties The properties to exclude when checking if the value is a Target JSON object.
   * @returns True if the value is a TargetEnvironment JSON object.
   */
  public static isJson(
    obj: AnyObject,
    excludedKeys: (keyof TTargetEnvJson)[] = [],
  ): obj is TTargetEnvJson {
    // Only grab the keys that are not excluded.
    const requiredKeys = Object.keys(
      TargetEnvironment.DEFAULT_PROPERTIES,
    ).filter((key) => !excludedKeys.includes(key as keyof TTargetEnvJson))
    // Check if the required keys are present in the object.
    const keysPassed = Object.keys(obj)
    return keysPassed.every((key) => requiredKeys.includes(key))
  }

  /**
   * Default properties set when creating a new TargetEnvironment object.
   */
  public static readonly DEFAULT_PROPERTIES: TTargetEnvJson = {
    _id: 'metis-target-env-default',
    name: 'Select a target environment',
    description: 'This is a default target environment.',
    version: '0.1',
    targets: [],
  }

  /**
   * The internal target environment used for creating effects.
   */
  public static get INTERNAL_TARGET_ENV(): TTargetEnvJson {
    return {
      _id: 'metis',
      name: 'METIS',
      description: '',
      version: '0.1',
      targets: Target.INTERNAL_TARGETS,
    }
  }
}

/* ------------------------------ TARGET ENVIRONMENT TYPES ------------------------------ */

/**
 * Extracts the target env type from the mission types.
 * @param T The mission types.
 * @returns The target env type.
 */
export type TTargetEnv<T extends TCommonMissionTypes> = T['targetEnv']

/**
 * The JSON representation of a TargetEnvironment object.
 */
export interface TTargetEnvJson {
  /**
   * The ID of the target environment.
   */
  _id: string
  /**
   * The name of the target environment.
   */
  name: string
  /**
   * Describes what the target environment is.
   */
  description: string
  /**
   * The current version of the target environment.
   */
  version: string
  /**
   * The JSON representation of the targets in
   * the environment.
   */
  targets: TTargetJson[]
}
