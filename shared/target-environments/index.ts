import { TCommonTarget, TCommonTargetJson } from './targets'

/**
 * This is the environment in which the target(s) exist.
 */
export default abstract class TargetEnvironment<TTarget extends TCommonTarget>
  implements TCommonTargetEnvironment
{
  // Inherited
  public id: TCommonTargetEnvironment['id']

  // Inherited
  public name: TCommonTargetEnvironment['name']

  // Inherited
  public description: TCommonTargetEnvironment['description']

  // todo: remove (target-environment)
  // // Inherited
  // public host: TCommonTargetEnvironment['host']

  // todo: remove (target-environment)
  // // Inherited
  // public apiKey: TCommonTargetEnvironment['apiKey']

  // Inherited
  public targets: TTarget[]

  /**
   * Creates a new TargetEnvironment Object.
   * @param {TCommonTargetEnvironmentJson} data The data to use to create the TargetEnvironment.
   */
  public constructor(
    data: Partial<TCommonTargetEnvironmentJson> = TargetEnvironment.DEFAULT_PROPERTIES,
    options: TTargetEnvironmentOptions = {},
  ) {
    this.id = data.id ?? TargetEnvironment.DEFAULT_PROPERTIES.id
    this.name = data.name ?? TargetEnvironment.DEFAULT_PROPERTIES.name
    this.description =
      data.description ?? TargetEnvironment.DEFAULT_PROPERTIES.description
    // todo: remove (target-environment)
    // this.host = data.host ?? TargetEnvironment.DEFAULT_PROPERTIES.host
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
   * @param {TTargetEnvironmentJsonOptions} options Options for converting the TargetEnvironment to JSON.
   * @returns {TCommonTargetEnvironmentJson} A JSON representation of the TargetEnvironment.
   */
  public toJson(
    options: TTargetEnvironmentJsonOptions = {},
  ): TCommonTargetEnvironmentJson {
    // Construct JSON object to send to the server.
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      // todo: remove (target-environment)
      // host: this.host,
      targets: this.targets.map((target: TCommonTarget) => target.toJson()),
    }
  }

  /**
   * The default properties of the TargetEnvironment.
   */
  public static readonly DEFAULT_PROPERTIES: Required<TCommonTargetEnvironmentJson> =
    {
      id: '',
      name: '',
      description: '',
      // todo: remove (target-environment)
      // host: '',
      targets: [],
    }
}

/* ------------------------------ TARGET ENVIRONMENT TYPES ------------------------------ */

/**
 * The available request methods for the effects API.
 */
export type RequestMethod = 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE'

/**
 * Options for creating a new TargetEnvironment object.
 */
export type TTargetEnvironmentOptions = {}

/**
 * Options for the TargetEnvironment.toJson() method.
 */
export type TTargetEnvironmentJsonOptions = {}

/**
 * Type used for the Target Environment class.
 */
export interface TCommonTargetEnvironment {
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

  // todo: remove (target-environment)
  // /**
  //  * The host of the environment.
  //  */
  // host: string
  // todo: remove (target-environment)
  // /**
  //  * The API key for the environment.
  //  */
  // apiKey: string | undefined

  /**
   * The targets in the environment.
   */
  targets: TCommonTarget[]
  /**
   * Converts the TargetEnvironment Object to JSON.
   */
  toJson: (
    options?: TTargetEnvironmentJsonOptions,
  ) => TCommonTargetEnvironmentJson
}

/**
 * The JSON representation of a TargetEnvironment object.
 */
export interface TCommonTargetEnvironmentJson {
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

  // todo: remove (target-environment)
  // /**
  //  * The host of the environment.
  //  */
  // host: string

  /**
   * The JSON representation of the targets in
   * the environment.
   */
  targets: TCommonTargetJson[]
}
