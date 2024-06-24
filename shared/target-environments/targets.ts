import { TCommonMissionTypes } from 'metis/missions'
import { AnyObject } from 'metis/toolbox/objects'
import TargetEnvironment, { TCommonTargetEnv, TTargetEnv } from '.'
import Args, { TTargetArg, TTargetArgJson } from './args'
import { Dependency } from './dependencies'

/**
 * This is an entity that can be found in a target environment.
 */
export default abstract class Target<
  T extends TCommonMissionTypes = TCommonMissionTypes,
> implements TCommonTarget
{
  // Inherited
  public targetEnvironment: TTargetEnv<T>

  // Inherited
  public _id: TCommonTarget['_id']

  // Inherited
  public name: TCommonTarget['name']

  // Inherited
  public description: TCommonTarget['description']

  // Inherited
  public script: TCommonTarget['script']

  // Inherited
  public args: TCommonTarget['args']

  /**
   * Creates a new Target Object.
   * @param targetEnvironment The environment in which the target exists.
   * @param data The data to use to create the Target.
   * @param options The options for creating the Target.
   */
  public constructor(
    targetEnvironment: TTargetEnv<T>,
    data: Partial<TCommonTargetJson> = Target.DEFAULT_PROPERTIES,
    options: TTargetOptions = {},
  ) {
    this.targetEnvironment = targetEnvironment
    this._id = data._id ?? Target.DEFAULT_PROPERTIES._id
    this.name = data.name ?? Target.DEFAULT_PROPERTIES.name
    this.description = data.description ?? Target.DEFAULT_PROPERTIES.description
    this.script = data.script ?? Target.DEFAULT_PROPERTIES.script
    this.args = Args.fromJson(data.args ?? Target.DEFAULT_PROPERTIES.args)
  }

  /**
   * Converts the Target Object to JSON.
   * @param options Options for converting the Target to JSON.
   * @returns A JSON representation of the Target.
   */
  public toJson(): TCommonTargetJson {
    // Construct JSON object to send to the server.
    return {
      targetEnvId: this.targetEnvironment._id,
      _id: this._id,
      name: this.name,
      description: this.description,
      script: this.script,
      args: Args.toJson(this.args),
    }
  }

  /**
   * Determines if all the dependencies of an argument are met.
   * @param arg The argument to check if all dependencies are met.
   * @param effectArgs The arguments that are used to create the effect on the target.
   * @returns If all the dependencies are met.
   */
  public allDependenciesMet = (
    arg: TTargetArg,
    effectArgs: AnyObject,
  ): boolean => {
    // If the argument has no dependencies, then the argument is always displayed.
    if (!arg.dependencies || arg.dependencies.length === 0) {
      return true
    }

    // Stores the status of all the argument's dependencies.
    let areDependenciesMet: boolean[] = []
    // Create a variable to determine if all the dependencies
    // have been met.
    let allDependenciesMet: boolean

    // Iterate through the dependencies.
    arg.dependencies.forEach((dependency) => {
      // Grab the dependency argument.
      let dependencyArg: TTargetArg | undefined = this.args.find(
        (arg: TTargetArg) => arg._id === dependency.dependentId,
      )

      // If the dependency argument is found then check if
      // the dependency is met.
      if (dependencyArg) {
        // Check if the dependency is met.
        let dependencyMet: boolean = dependency.condition(
          effectArgs[dependency.dependentId],
        )

        // If the dependency is met then push true to the
        // dependencies met array, otherwise push false.
        dependencyMet
          ? areDependenciesMet.push(true)
          : areDependenciesMet.push(false)
      }
      // Otherwise, the dependency argument doesn't exist.
      else {
        areDependenciesMet.push(false)
      }
    })

    // If all the dependencies have been met then set the
    // variable to true, otherwise set it to false.
    allDependenciesMet = !areDependenciesMet.includes(false)

    // Return the status of all the dependencies.
    return allDependenciesMet
  }

  /**
   * Default properties set when creating a new Target object.
   */
  public static get DEFAULT_PROPERTIES(): TCommonTargetJson {
    return {
      targetEnvId: TargetEnvironment.DEFAULT_PROPERTIES._id,
      _id: 'metis-target-default',
      name: 'Select a target',
      description: 'This is a default target.',
      script: () => {},
      args: [],
    }
  }

  /**
   * The node target that is available in the METIS target environment.
   */
  public static nodeTarget: TCommonTargetJson = {
    targetEnvId: 'metis',
    _id: 'node',
    name: 'Node',
    description: '',
    script: () => {},
    args: [
      {
        _id: 'block-node',
        name: 'Block Node',
        required: true,
        groupingId: 'block-node',
        type: 'boolean',
        default: true,
      },
      {
        _id: 'success-chance',
        name: 'Chance of Success',
        type: 'number',
        required: false,
        min: -100,
        max: 100,
        unit: '%',
        groupingId: 'block-node',
        dependencies: [Dependency.FALSEY('block-node')],
        tooltipDescription:
          `This allows you to positively or negatively affect the chance of success for all actions within the node. A positive value increases the chance of success, while a negative value decreases the chance of success.\n` +
          `\t\n` +
          `For example, if the chance of success is 50% and you set the chance of success to +10%, then the chance of success will be 60%.\n` +
          `\t\n` +
          `*Note: If the result is less than 0%, then the chance of success will be 0%. If the result is greater than 100%, then the chance of success will be 100%.*`,
      },
      {
        _id: 'process-time',
        name: 'Process Time',
        type: 'number',
        required: false,
        min: -3600,
        max: 3600,
        unit: 's',
        groupingId: 'block-node',
        dependencies: [Dependency.FALSEY('block-node')],
        tooltipDescription:
          `This allows you to positively or negatively affect the process time for all actions within the node. A positive value increases the process time, while a negative value decreases the process time.\n` +
          `\t\n` +
          `For example, if the process time is 60s and you set the process time to +10s, then the process time will be 70s.\n` +
          `\t\n` +
          `*Note: If the result is less than 0s, then the process time will be 0s. If the result is greater than 3600s, then the process time will be 3600s.*`,
      },
      {
        _id: 'resource-cost',
        name: 'Resource Cost',
        type: 'number',
        required: false,
        groupingId: 'block-node',
        dependencies: [Dependency.FALSEY('block-node')],
        tooltipDescription:
          `This allows you to positively or negatively affect the resource cost for all actions within the node. A positive value increases the resource cost, while a negative value decreases the resource cost.\n` +
          `\t\n` +
          `For example, if the resource cost is 100 and you set the resource cost to +10, then the resource cost will be 110.\n` +
          `\t\n` +
          `*Note: If the result is less than 0, then the resource cost will be 0.*`,
      },
    ],
  }

  /**
   * The output target that is available in the METIS target environment.
   */
  public static outputTarget: TCommonTargetJson = {
    targetEnvId: 'metis',
    _id: 'output',
    name: 'Output Panel',
    description: '',
    script: () => {},
    args: [
      {
        _id: 'message',
        name: 'Message',
        required: true,
        type: 'large-string',
        default: 'Enter your message here.',
      },
    ],
  }

  /**
   * The internal targets that are available in the METIS target environment.
   */
  public static INTERNAL_TARGETS: TCommonTargetJson[] = [
    Target.nodeTarget,
    Target.outputTarget,
  ]
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
  targetEnvironment: TCommonTargetEnv
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
  script: Function
  /**
   * The arguments used to create the effect on the target.
   */
  args: TTargetArg[]
  /**
   * Converts the Target Object to JSON.
   * @param options Options for converting the Target to JSON.
   * @returns A JSON representation of the Target.
   */
  toJson: (options?: TTargetJsonOptions) => TCommonTargetJson
  /**
   * Determines if all the dependencies of an argument are met.
   * @param arg The argument to check if all dependencies are met.
   * @param effectArgs The arguments that are used to create the effect on the target.
   * @returns If all the dependencies are met.
   */
  allDependenciesMet: (arg: TTargetArg, effectArgs: AnyObject) => boolean
}

/**
 * Extracts the target type from the mission types.
 * @param T The mission types.
 * @returns The target type.
 */
export type TTarget<T extends TCommonMissionTypes> = T['target']

/**
 * The JSON representation of a Target Object.
 */
export interface TCommonTargetJson {
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
  script: Function
  /**
   * The arguments used to create the effect on the target.
   */
  args: TTargetArgJson[]
}
