import { AnyObject } from 'metis/toolbox/objects'
import TargetEnvironment, { TCommonTargetEnv, TTargetEnv } from '.'
import { TTargetEnvContext } from '../../server/target-environments/context-provider'
import { TCommonMission, TCommonMissionTypes } from '../../shared/missions'
import Arg, { TTargetArg, TTargetArgJson } from './args'
import ForceArg from './args/force-arg'
import NodeArg from './args/node-arg'
import Dependency, { TDependencyConditionResult } from './dependencies'

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
    this.args = Arg.fromJson(data.args ?? Target.DEFAULT_PROPERTIES.args)
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
      args: Arg.toJson(this.args),
    }
  }

  /**
   * Determines if all the dependencies passed are met.
   * @param effectArgs What to check the dependencies against to see if they are met.
   * @param dependencies The dependencies to check if all are met.
   * @param mission The mission that the effect is a part of.
   * @returns The status (`"valid"`, `"warning"`, or `"invalid"`) of the dependencies based on the dependencies' conditions.
   */
  public allDependenciesMet = (
    effectArgs: AnyObject,
    dependencies: Dependency[] = [],
    mission?: TCommonMission,
  ): TDependencyConditionResult => {
    // If the argument has no dependencies, then the argument is always displayed.
    if (!dependencies || dependencies.length === 0) {
      return 'valid'
    }

    // Stores the status of all the argument's dependencies.
    let areDependenciesMet: TDependencyConditionResult[] = []

    // Iterate through the dependencies.
    dependencies.forEach((dependency) => {
      // Grab the dependency argument.
      let dependencyArg: TTargetArg | undefined = this.args.find(
        (arg: TTargetArg) => arg._id === dependency.dependentId,
      )

      // If the dependency argument is found then check if
      // the dependency is met.
      if (dependencyArg) {
        // Initialize a variable to determine the dependency's status.
        let dependencyStatus: TDependencyConditionResult

        // If the dependency is a force dependency then check
        // if the force exists and the dependency's status.
        if (dependency.name === 'VALIDATE_FORCE' && mission) {
          // Ensure the force argument exists within the effect arguments.
          let forceInArgs: AnyObject | undefined =
            effectArgs[dependency.dependentId]
          // Ensure the force ID exists within the force argument.
          let forceId: string | undefined = forceInArgs
            ? forceInArgs[ForceArg.FORCE_ID_KEY]
            : undefined
          // Get the force from the mission.
          let force = forceId ? mission.getForce(forceId) : undefined
          // Check the dependency's status.
          dependencyStatus = dependency.condition(force)
        }
        // If the dependency is a node dependency then check
        // if the node exists and the dependency's status.
        else if (dependency.name === 'VALIDATE_NODE' && mission) {
          // Ensure the node argument exists within the effect arguments.
          let nodeInArgs: AnyObject | undefined =
            effectArgs[dependency.dependentId]
          // Ensure the force ID exists within the node argument.
          let forceId: string | undefined = nodeInArgs
            ? nodeInArgs[ForceArg.FORCE_ID_KEY]
            : undefined
          // Ensure the node ID exists within the node argument.
          let nodeId: string | undefined = nodeInArgs
            ? nodeInArgs[NodeArg.NODE_ID_KEY]
            : undefined
          // Get the force from the mission.
          let force = forceId ? mission.getForce(forceId) : undefined
          // Get the node from the mission.
          let node = nodeId ? mission.getNode(nodeId) : undefined
          // Create the value to check the dependency's status.
          let value = {
            force: force,
            node: node,
          }
          // Check the dependency's status.
          dependencyStatus = dependency.condition(value)
        }
        // Otherwise, check the dependency's status.
        else {
          dependencyStatus = dependency.condition(
            effectArgs[dependency.dependentId],
          )
        }

        // Add the dependency status to the list of dependencies.
        areDependenciesMet.push(dependencyStatus)
      }
      // Otherwise, the dependency argument doesn't exist.
      else {
        areDependenciesMet.push('invalid')
      }
    })

    // If any of the dependencies are labeled as invalid, then
    // the status of all the dependencies is invalid.
    if (areDependenciesMet.includes('invalid')) {
      return 'invalid'
    }

    // If any of the dependencies are labeled as a warning, then
    // the status of all the dependencies is a warning.
    if (areDependenciesMet.includes('warning')) {
      return 'warning'
    }

    // Otherwise, all the dependencies are valid.
    return 'valid'
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
      script: async () => {},
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
    script: async (context) => {
      // Extract the arguments from the effect.
      let {
        nodeMetadata,
        blockNode,
        successChance,
        processTime,
        resourceCost,
      } = context.effect.args

      // Set the error message.
      const errorMessage =
        `Bad request. The arguments sent with the effect are invalid. Please check the arguments within the effect.\n` +
        `Effect ID: "${context.effect._id}"\n` +
        `Effect Name: "${context.effect.name}"`

      // Check if the arguments are valid.
      if (
        typeof nodeMetadata.forceId !== 'string' ||
        typeof nodeMetadata.nodeId !== 'string' ||
        typeof blockNode !== 'boolean'
      ) {
        throw new Error(errorMessage)
      }

      // Update the block status of the node.
      blockNode
        ? context.blockNode(nodeMetadata.nodeId, nodeMetadata.forceId)
        : context.unblockNode(nodeMetadata.nodeId, nodeMetadata.forceId)

      // If the success chance is a number, then modify the success chance.
      if (successChance && typeof successChance === 'number') {
        context.modifySuccessChance(
          nodeMetadata.nodeId,
          nodeMetadata.forceId,
          successChance / 100,
        )
      }
      // Otherwise, throw an error.
      else if (successChance && typeof successChance !== 'number') {
        throw new Error(errorMessage)
      }

      // If the process time is a number, then modify the process time.
      if (processTime && typeof processTime === 'number') {
        context.modifyProcessTime(
          nodeMetadata.nodeId,
          nodeMetadata.forceId,
          processTime * 1000,
        )
      }
      // Otherwise, throw an error.
      else if (processTime && typeof processTime !== 'number') {
        throw new Error(errorMessage)
      }

      // If the resource cost is a number, then modify the resource cost.
      if (resourceCost && typeof resourceCost === 'number') {
        context.modifyResourceCost(
          nodeMetadata.nodeId,
          nodeMetadata.forceId,
          resourceCost,
        )
      }
      // Otherwise, throw an error.
      else if (resourceCost && typeof resourceCost !== 'number') {
        throw new Error(errorMessage)
      }
    },
    args: [
      {
        type: 'node',
        _id: 'nodeMetadata',
        name: 'Node',
        required: true,
        groupingId: 'node',
      },
      {
        type: 'boolean',
        _id: 'blockNode',
        name: 'Block Node',
        required: false,
        groupingId: 'block-node',
        dependencies: [Dependency.VALIDATE_NODE('nodeMetadata')],
      },
      {
        type: 'boolean',
        _id: 'modifyActions',
        name: 'Modify Actions',
        required: false,
        groupingId: 'actions',
        dependencies: [Dependency.VALIDATE_NODE('nodeMetadata')],
      },
      {
        type: 'number',
        _id: 'successChance',
        name: 'Probability of Success',
        required: false,
        min: -100,
        max: 100,
        unit: '%',
        groupingId: 'actions',
        dependencies: [
          Dependency.TRUTHY('modifyActions'),
          Dependency.VALIDATE_NODE('nodeMetadata'),
        ],
        tooltipDescription:
          `This allows you to positively or negatively affect the chance of success for all actions within the node. A positive value increases the chance of success, while a negative value decreases the chance of success.\n` +
          `\t\n` +
          `For example, if the chance of success is 50% and you set the chance of success to +10%, then the chance of success will be 60%.\n` +
          `\t\n` +
          `*Note: If the result is less than 0%, then the chance of success will be 0%. If the result is greater than 100%, then the chance of success will be 100%.*`,
      },
      {
        type: 'number',
        _id: 'processTime',
        name: 'Process Time',
        required: false,
        min: -3600,
        max: 3600,
        unit: 's',
        groupingId: 'actions',
        dependencies: [
          Dependency.TRUTHY('modifyActions'),
          Dependency.VALIDATE_NODE('nodeMetadata'),
        ],
        tooltipDescription:
          `This allows you to positively or negatively affect the process time for all actions within the node. A positive value increases the process time, while a negative value decreases the process time.\n` +
          `\t\n` +
          `For example, if the process time is 60s and you set the process time to +10s, then the process time will be 70s.\n` +
          `\t\n` +
          `*Note: If the result is less than 0s, then the process time will be 0s. If the result is greater than 3600s, then the process time will be 3600s.*`,
      },
      {
        type: 'number',
        _id: 'resourceCost',
        name: 'Resource Cost',
        required: false,
        groupingId: 'actions',
        dependencies: [
          Dependency.TRUTHY('modifyActions'),
          Dependency.VALIDATE_NODE('nodeMetadata'),
        ],
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
    script: async (context) => {
      let { forceMetaData, message } = context.effect.args

      // Output the message to the force.
      context.sendOutputMessage(forceMetaData.forceId, message)
    },
    args: [
      {
        type: 'force',
        _id: 'forceMetaData',
        name: 'Force',
        required: true,
        groupingId: 'output',
      },
      {
        type: 'large-string',
        _id: 'message',
        name: 'Message',
        required: false,
        groupingId: 'output',
        dependencies: [Dependency.VALIDATE_FORCE('forceMetaData')],
        tooltipDescription:
          `This is the message that will be displayed in the output panel for the force selected above.\n` +
          `\t\n` +
          `**Note: If this field is left blank, then nothing will be displayed in the output panel.**`,
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
 * Represents the target's script.
 */
export type TTargetScript<TMission> = (
  /**
   * The arguments used to execute the effect on the target.
   */
  args: AnyObject,
  /**
   * The mission that the target is a part of.
   */
  mission: TMission,
) => Promise<void>

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
  script: (
    /**
     * The context for the target environment.
     */
    context: TTargetEnvContext,
  ) => Promise<void>
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
   * Determines if all the dependencies passed are met.
   * @param effectArgs What to check the dependencies against to see if they are met.
   * @param dependencies The dependencies to check if all are met.
   * @param mission The mission that the effect is a part of.
   * @returns The status (`"valid"`, `"warning"`, or `"invalid"`) of the dependencies based on the dependencies' conditions.
   */
  allDependenciesMet: (
    effectArgs: AnyObject,
    dependencies?: Dependency[],
    mission?: TCommonMission,
  ) => TDependencyConditionResult
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
  script: (
    /**
     * The context for the target environment.
     */
    context: TTargetEnvContext,
  ) => Promise<void>
  /**
   * The arguments used to create the effect on the target.
   */
  args: TTargetArgJson[]
}
