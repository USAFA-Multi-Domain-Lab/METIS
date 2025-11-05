import { MetisComponent } from '../MetisComponent'
import type { TAnyObject } from '../toolbox'
import type { TTargetJson } from './types'

/**
 * This is the environment in which the target(s) exist.
 */
export abstract class TargetEnvironment<
  T extends TMetisBaseComponents = TMetisBaseComponents,
> extends MetisComponent {
  /**
   * Creates a new {@link TargetEnvironment} Object.
   */
  protected constructor(
    _id: string,
    name: string,
    /**
     * Describes what the target environment is.
     */
    public description: string,

    /**
     * The current version of the target environment.
     */
    public version: string,
    /**
     * The targets in the environment.
     */
    public targets: T['target'][] = [],
  ) {
    super(_id, name, false)

    this.description = description
    this.version = version
  }

  /**
   * Registers the target environment with the registry.
   * @note If the target environment is already registered,
   * a warning will be logged and the registration will be
   * skipped.
   * @returns Itself, to allow for chaining calls.
   */
  public abstract register(): T['targetEnv']

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
   * @param _id The ID of the target.
   * @returns The target with the provided ID, or
   * undefined if the target cannot be found.
   */
  public getTarget(_id: string | null | undefined): T['target'] | undefined {
    return this.targets.find((target) => target._id === _id)
  }

  /**
   * Checks if the provided value is a TargetEnvironment JSON object.
   * @param obj The object to check.
   * @param excludedProperties The properties to exclude when checking if the value is a Target JSON object.
   * @returns True if the value is a TargetEnvironment JSON object.
   */
  public static isJson(
    obj: TAnyObject,
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
}

/* -- TYPES -- */

/**
 * Extracts the target environment type from a registry of METIS
 * components type that extends `TMetisBaseComponents`.
 * @param T The type registry.
 * @returns The target environment type.
 */
export type TTargetEnv<T extends TMetisBaseComponents> = T['targetEnv']

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
