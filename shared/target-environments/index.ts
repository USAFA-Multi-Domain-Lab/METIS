import { TCommonTarget, TCommonTargetJson } from './targets'

/**
 * This is the environment in which the target(s) exist.
 */
export default abstract class TargetEnvironment<TTarget extends TCommonTarget>
  implements TCommonTargetEnv
{
  // Inherited
  public id: TCommonTargetEnv['id']

  // Inherited
  public name: TCommonTargetEnv['name']

  // Inherited
  public description: TCommonTargetEnv['description']

  // Inherited
  public version: TCommonTargetEnv['version']

  // Inherited
  public targets: TTarget[]

  /**
   * Creates a new TargetEnvironment Object.
   * @param {TCommonTargetEnvJson} data The data to use to create the TargetEnvironment.
   */
  public constructor(
    data: Partial<TCommonTargetEnvJson> = TargetEnvironment.DEFAULT_PROPERTIES,
    options: TTargetEnvOptions = {},
  ) {
    this.id = data.id ?? TargetEnvironment.DEFAULT_PROPERTIES.id
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
   * @param {TCommonTargetJson[]} data The target data to parse.
   * @returns {TTarget[]} An array of Target Objects.
   */
  public abstract parseTargets(data: TCommonTargetJson[]): TTarget[]

  /**
   * Converts the TargetEnvironment Object to JSON.
   * @param {TTargetEnvJsonOptions} options Options for converting the TargetEnvironment to JSON.
   * @returns {TCommonTargetEnvJson} A JSON representation of the TargetEnvironment.
   */
  public toJson(options: TTargetEnvJsonOptions = {}): TCommonTargetEnvJson {
    // Construct JSON object to send to the server.
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      version: this.version,
      targets: this.targets.map((target: TCommonTarget) => target.toJson()),
    }
  }

  /**
   * Default properties set when creating a new TargetEnvironment object.
   */
  public static get DEFAULT_PROPERTIES(): TCommonTargetEnvJson {
    return {
      id: 'metis-target-env-default',
      name: 'Select a target environment',
      description: 'This is a default target environment.',
      version: '0.1',
      targets: [],
    }
  }
}

/* ------------------------------ TARGET ENVIRONMENT TYPES ------------------------------ */

/**
 * Options for creating a new TargetEnvironment object.
 */
export type TTargetEnvOptions = {}

/**
 * Options for the TargetEnvironment.toJson() method.
 */
export type TTargetEnvJsonOptions = {}

/**
 * Type used for the Target Environment class.
 */
export interface TCommonTargetEnv {
  /**
   * The ID of the target environment.
   */
  id: string
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
   * The targets in the environment.
   */
  targets: TCommonTarget[]
  /**
   * Converts the TargetEnvironment Object to JSON.
   */
  toJson: (options?: TTargetEnvJsonOptions) => TCommonTargetEnvJson
}

/**
 * The JSON representation of a TargetEnvironment object.
 */
export interface TCommonTargetEnvJson {
  /**
   * The ID of the target environment.
   */
  id: string
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
  targets: TCommonTargetJson[]
}
