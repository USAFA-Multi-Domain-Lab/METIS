import { TCommonTargetEnv, TTargetEnv } from '.'
import { TTargetEnvContext } from '../../server/target-environments/context-provider'
import { TCommonMissionTypes } from '../../shared/missions'
import Arg, { TTargetArg, TTargetArgJson } from './args'
import Dependency from './dependencies'

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
   * Default properties set when creating a new Target object.
   */
  public static readonly DEFAULT_PROPERTIES: TCommonTargetJson = {
    targetEnvId: 'metis-target-env-default',
    _id: 'metis-target-default',
    name: 'Select a target',
    description: 'This is a default target.',
    script: async () => {},
    args: [],
  }

  /**
   * The node target that is available in the METIS target environment.
   */
  public static readonly nodeTarget: TCommonTargetJson = {
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
        groupingId: 'block-node',
        dependencies: [Dependency.NODE('nodeMetadata')],
      },
      {
        type: 'boolean',
        _id: 'modifyActions',
        name: 'Modify Actions',
        groupingId: 'actions',
        dependencies: [Dependency.NODE('nodeMetadata')],
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
          Dependency.NODE('nodeMetadata'),
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
          Dependency.NODE('nodeMetadata'),
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
          Dependency.NODE('nodeMetadata'),
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
  public static readonly outputTarget: TCommonTargetJson = {
    targetEnvId: 'metis',
    _id: 'output',
    name: 'Output Panel',
    description: '',
    script: async (context) => {
      // Extract the effect and its arguments from the context.
      let { effect, user } = context
      let { forceMetaData, message } = effect.args

      // Output the message to the force.
      context.sendOutput(forceMetaData.forceId, message, effect, user)
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
        dependencies: [Dependency.FORCE('forceMetaData')],
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
  public static readonly INTERNAL_TARGETS: TCommonTargetJson[] = [
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
