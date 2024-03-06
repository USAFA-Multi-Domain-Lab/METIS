import { TCommonTargetEnv } from '.'

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
      id: this.id,
      name: this.name,
      description: this.description,
      script: this.script,
      args: this.args,
    }
  }

  /**
   * The default properties of the Target.
   */
  public static readonly DEFAULT_PROPERTIES: Required<TCommonTargetJson> = {
    id: '',
    name: '',
    description: '',
    script: () => {},
    args: [],
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
 * The common arguments used for the target-effect interface and the target-effect API.
 */
type TTargetArgCommon = {
  /**
   * The ID of the argument.
   */
  id: string
  /**
   * The argument's name. This is displayed to the user.
   */
  name: string
  /**
   * Determines whether the argument is required or not.
   */
  required: boolean
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
type TTargetNumberArg = {
  /**
   * The input type of the argument.
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
   * The default value for the argument.
   * @default 0
   */
  default?: number
  /**
   * The unit of measurement for the argument.
   */
  unit?: string
}

/**
 * The dropdown argument type for a target.
 */
type TTargetDropdownArg = {
  /**
   * The type of the argument.
   */
  type: 'dropdown'
  /**
   * The options for the argument.
   */
  options: Array<{
    /**
     * The ID of the option.
     */
    id: string
    /**
     * The option's name. This is displayed to the user.
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
type TTargetBooleanArg = {
  /**
   * The type of the argument.
   */
  type: 'boolean'
  /**
   * The default value for the argument.
   * @default false
   */
  default?: boolean
}

/**
 * The standard string argument type for a target.
 */
type TTargetStringArg = {
  /**
   * The type of the argument.
   */
  type: 'string'
  /**
   * The default value for the argument.
   * @default undefined
   */
  default?: string
}

/**
 * The medium character string argument type for a target.
 */
type TTargetMedCharStringArg = {
  /**
   * The type of the argument.
   */
  type: 'medium-string'
  /**
   * The default value for the argument.
   * @default undefined
   */
  default?: string
}

/**
 * The arguments used for the target-effect interface and the target-effect API.
 */
export type TTargetArg = TTargetArgCommon &
  (
    | TTargetBooleanArg
    | TTargetNumberArg
    | TTargetStringArg
    | TTargetMedCharStringArg
    | TTargetDropdownArg
  )
