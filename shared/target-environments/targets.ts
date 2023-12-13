import axios from 'axios'
import { TCommonTargetEnvironment, TargetEnvironment } from '.'

/**
 * This is an entity that can be found in a target environment.
 */
export abstract class Target<
  TTargetEnvironment extends TCommonTargetEnvironment,
> implements TCommonTarget
{
  // Inherited
  public targetEnvironment: TTargetEnvironment

  // Inherited
  public id: TCommonTarget['id']

  // Inherited
  public name: TCommonTarget['name']

  // Inherited
  public description: TCommonTarget['description']

  /**
   * Creates a new Target Object.
   * @param {TCommonTargetJson} data The data to use to create the Target.
   */
  public constructor(
    targetEnvironment: TTargetEnvironment,
    data: Partial<TCommonTargetJson> = Target.DEFAULT_PROPERTIES,
    options: TTargetOptions = {},
  ) {
    this.targetEnvironment = targetEnvironment
    this.id = data.id ?? Target.DEFAULT_PROPERTIES.id
    this.name = data.name ?? Target.DEFAULT_PROPERTIES.name
    this.description = data.description ?? Target.DEFAULT_PROPERTIES.description
  }

  /**
   * Converts the Target Object to JSON.
   * @param {TTargetJsonOptions} options Options for converting the Target to JSON.
   * @returns {TCommonTargetJson} A JSON representation of the Target.
   */
  public toJson(options: TTargetJsonOptions = {}): TCommonTargetJson {
    // Construct JSON object to send to the server.
    return {
      targetEnvironmentId: this.targetEnvironment.id,
      id: this.id,
      name: this.name,
      description: this.description,
    }
  }

  /**
   * The default properties of the Target.
   */
  public static readonly DEFAULT_PROPERTIES: Required<TCommonTargetJson> = {
    targetEnvironmentId: '',
    id: '',
    name: '',
    description: '',
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
 * Interface for the Target class.
 */
export interface TCommonTarget {
  /**
   * The environment in which the target exists.
   */
  targetEnvironment: TCommonTargetEnvironment
  /**
   * The ID of the target.
   */
  id: string
  /**
   * The name of the target.
   */
  name: string
  /**
   * Describes what the target is.
   */
  description: string
  /**
   * Converts the Target Object to JSON.
   */
  toJson: (options?: TTargetJsonOptions) => TCommonTargetJson
}

/**
 * The JSON representation of a Target Object.
 */
export interface TCommonTargetJson {
  /**
   * The ID of the target environment.
   */
  targetEnvironmentId: TCommonTargetEnvironment['id']
  /**
   * The ID of the target.
   */
  id: string
  /**
   * The name of the target.
   */
  name: string
  /**
   * Describes what the target is.
   */
  description: string
}
