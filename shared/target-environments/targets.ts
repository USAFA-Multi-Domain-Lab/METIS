import { TCommonMissionTypes } from 'metis/missions'
import TargetEnvironment, { TCommonTargetEnv, TTargetEnv } from '.'

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
    this.args = data.args ?? Target.DEFAULT_PROPERTIES.args
  }

  /**
   * Converts the Target Object to JSON.
   * @param options Options for converting the Target to JSON.
   * @returns A JSON representation of the Target.
   */
  public toJson(options: TTargetJsonOptions = {}): TCommonTargetJson {
    // Construct JSON object to send to the server.
    return {
      targetEnvId: this.targetEnvironment._id,
      _id: this._id,
      name: this.name,
      description: this.description,
      script: this.script,
      args: this.args,
    }
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
        display: true,
        groupingId: 'block-node',
        type: 'boolean',
        default: true,
      },
      {
        _id: 'success-chance',
        name: 'Chance of Success',
        required: false,
        display: false,
        groupingId: 'block-node',
        type: 'number',
        // default: 0,
        dependencies: ['block-node'],
      },
      {
        _id: 'process-time',
        name: 'Process Time',
        required: false,
        display: true,
        groupingId: 'block-node',
        type: 'number',
        // default: 0,
        dependencies: ['block-node'],
      },
      {
        _id: 'resource-cost',
        name: 'Resource Cost',
        required: false,
        display: true,
        groupingId: 'block-node',
        type: 'number',
        // default: 0,
        dependencies: ['block-node'],
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
        display: true,
        type: 'large-string',
        default: '<p>Enter your message here.</p>',
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
  script: Function
  /**
   * The arguments used to create the effect on the target.
   */
  args: TTargetArg[]
}

/* ------------------------------ TARGET ARGUMENT TYPES ------------------------------ */

/**
 * The base argument type for a target.
 */
type TBaseArg = {
  /**
   * The ID of the argument.
   */
  _id: string
  /**
   * The argument's name. This is displayed to the user.
   */
  name: string
  /**
   * Determines whether the argument is displayed to the user or not.
   */
  display: boolean
  /**
   * The grouping ID of the argument.
   * @note This is used to group arguments together in the target-effect interface.
   */
  groupingId?: string
  /**
   * These are the keys of the arguments that the current argument depends on.
   */
  dependencies?: string[]
}

/**
 * The number argument type for a target.
 */
type TNumberArg = TBaseArg &
  (TNumberArgOptional | TNumberArgRequired) & {
    /**
     * The argument's input type.
     * @note This will render as an input that only accepts numbers.
     */
    type: 'number'
    /**
     * The minimum allowed value for the argument.
     */
    min?: number
    /**
     * The maximum allowed value for the argument.
     */
    max?: number
    /**
     * The unit of measurement for the argument.
     */
    unit?: string
  }
/**
 * The optional number argument type for a target.
 */
type TNumberArgOptional = {
  /**
   * Determines whether the argument is required or not.
   */
  required: false
}
/**
 * The required number argument type for a target.
 */
type TNumberArgRequired = {
  /**
   * Determines whether the argument is required or not.
   */
  required: true
  /**
   * The default value for the argument.
   */
  default: number
}

/**
 * The string argument type for a target.
 */
type TStringArg = TBaseArg &
  (TStringArgOptional | TStringArgRequired) & {
    /**
     * The argument's input type.
     * @note This will render as an input that accepts any string.
     * If the argument is required, empty strings are not allowed.
     */
    type: 'string'
  }
/**
 * The optional string argument type for a target.
 */
type TStringArgOptional = {
  /**
   * Determines whether the argument is required or not.
   */
  required: false
  /**
   * The default value for the argument.
   */
  default?: string
}
/**
 * The required string argument type for a target.
 */
type TStringArgRequired = {
  /**
   * Determines whether the argument is required or not.
   */
  required: true
  /**
   * The default value for the argument.
   */
  default: string
}

/**
 * The large character string argument type for a target.
 */
type TLargeStringArg = TBaseArg &
  (TLargeStringArgOptional | TLargeStringArgRequired) & {
    /**
     * The argument's input type.
     * @note This will render as an input that accepts any string.
     * If the argument is required, empty strings are not allowed.
     */
    type: 'large-string'
  }
/**
 * The optional large character string argument type for a target.
 */
type TLargeStringArgOptional = {
  /**
   * Determines whether the argument is required or not.
   */
  required: false
  /**
   * The default value for the argument.
   */
  default?: string
}
/**
 * The required large character string argument type for a target.
 */
type TLargeStringArgRequired = {
  /**
   * Determines whether the argument is required or not.
   */
  required: true
  /**
   * The default value for the argument.
   */
  default: string
}

/**
 * The dropdown argument type for a target.
 */
type TDropdownArg = TBaseArg &
  (TDropdownArgOptional | TDropdownArgRequired) & {
    /**
     * The argument's input type.
     * @note This will render as a dropdown box with
     * predefined options for the user to select from.
     */
    type: 'dropdown'
    /**
     * The options for the argument.
     */
    options: Array<{
      /**
       * The ID of the option.
       */
      _id: string
      /**
       * The option's name.
       * @note This is displayed to the user.
       */
      name: string
    }>
  }
/**
 * The optional dropdown argument type for a target.
 */
type TDropdownArgOptional = {
  /**
   * Determines whether the argument is required or not.
   */
  required: false
}
/**
 * The required dropdown argument type for a target.
 */
type TDropdownArgRequired = {
  /**
   * Determines whether the argument is required or not.
   */
  required: true
  /**
   * The default value for the argument.
   */
  default: {
    /**
     * The ID of the option.
     */
    _id: string
    /**
     * The option's name. This is displayed to the user.
     */
    name: string
  }
}

/**
 * The boolean argument type for a target.
 */
type TBooleanArg = TBaseArg &
  (TBooleanArgOptional | TBooleanArgRequired) & {
    /**
     * The argument's input type.
     * @note This will render as a toggle switch.
     */
    type: 'boolean'
  }
/**
 * The optional boolean argument type for a target.
 */
type TBooleanArgOptional = {
  /**
   * Determines whether the argument is required or not.
   */
  required: false
}
/**
 * The required boolean argument type for a target.
 */
type TBooleanArgRequired = {
  /**
   * Determines whether the argument is required or not.
   */
  required: true
  /**
   * The default value for the argument.
   */
  default: boolean
}
/**
 * The arguments used for the target-effect interface and the target-effect API.
 */
export type TTargetArg =
  | TNumberArg
  | TStringArg
  | TLargeStringArg
  | TDropdownArg
  | TBooleanArg
