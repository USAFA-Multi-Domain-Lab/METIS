import TargetEnvironment, { TCommonTargetEnv } from '.'

/**
 * This is an entity that can be found in a target environment.
 */
export default abstract class Target<
  TTargetEnvironment extends TCommonTargetEnv,
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

  // Inherited
  public script: TCommonTarget['script']

  // Inherited
  public args: TCommonTarget['args']

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
    this.script = data.script ?? Target.DEFAULT_PROPERTIES.script
    this.args = data.args ?? Target.DEFAULT_PROPERTIES.args
  }

  /**
   * Converts the Target Object to JSON.
   * @param {TTargetJsonOptions} options Options for converting the Target to JSON.
   * @returns {TCommonTargetJson} A JSON representation of the Target.
   */
  public toJson(options: TTargetJsonOptions = {}): TCommonTargetJson {
    // Construct JSON object to send to the server.
    return {
      targetEnvId: this.targetEnvironment.id,
      id: this.id,
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
      targetEnvId: TargetEnvironment.DEFAULT_PROPERTIES.id,
      id: 'metis-target-default',
      name: 'Select a target',
      description: 'This is a default target.',
      script: () => {},
      args: [],
    }
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
  targetEnvironment: TCommonTargetEnv
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
  id: string
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
   * Optional parameters for the argument.
   */
  optionalParams?: {
    /**
     * These are the keys of the arguments that the current argument depends on.
     */
    dependencies?: string[]
  }
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
  /**
   * The default value for the argument.
   */
  default?: number
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
 * The medium character string argument type for a target.
 */
type TMedCharStringArg = TBaseArg &
  (TMedCharStringArgOptional | TMedCharStringArgRequired) & {
    /**
     * The argument's input type.
     * @note This will render as an input that accepts any string.
     * If the argument is required, empty strings are not allowed.
     */
    type: 'medium-string'
  }
/**
 * The optional medium character string argument type for a target.
 */
type TMedCharStringArgOptional = {
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
 * The required medium character string argument type for a target.
 */
type TMedCharStringArgRequired = {
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
type TDropdownArg = TBaseArg & {
  /**
   * The argument's input type.
   * @note This will render as a dropdown box with
   * predefined options for the user to select from.
   */
  type: 'dropdown'
  /**
   * Determines whether the argument is required or not.
   */
  required: boolean
  /**
   * The options for the argument.
   */
  options: Array<{
    /**
     * The ID of the option.
     */
    id: string
    /**
     * The option's name.
     * @note This is displayed to the user.
     */
    name: string
  }>
  /**
   * The default value for the argument.
   * @default { id: 'default', name: 'Select an option' }
   */
  default?: {
    /**
     * The ID of the option.
     */
    id: string
    /**
     * The option's name. This is displayed to the user.
     */
    name: string
  }
}

/**
 * The boolean argument type for a target.
 */
type TBooleanArg = TBaseArg & {
  /**
   * The argument's input type.
   * @note This will render as a toggle switch.
   */
  type: 'boolean'
  /**
   * Determines whether the argument is required or not.
   */
  required: boolean
  /**
   * The default value for the argument.
   * @default false
   */
  default?: boolean
}

/**
 * The arguments used for the target-effect interface and the target-effect API.
 */
export type TTargetArg =
  | TNumberArg
  | TStringArg
  | TMedCharStringArg
  | TDropdownArg
  | TBooleanArg
