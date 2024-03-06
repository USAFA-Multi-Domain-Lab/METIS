/* ---------------------------------- TARGET ENV TYPES -------------------------------------- */

/**
 * Represents a target environment.
 */
export type TTargetEnv = {
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
}

/* ---------------------------------- TARGET TYPES -------------------------------------- */

/**
 * Represents a target.
 */
export type TTarget = {
  /**
   * The ID of the target.
   */
  id: string
  /**
   * The ID of the target environment.
   */
  targetEnvId: string
  /**
   * The target's name. This is displayed to the user.
   */
  name: string
  /**
   * Describes what the target is. This is displayed to the user.
   */
  description: string
  /**
   * The function used to execute an effect on the target.
   */
  script: Function
  /**
   * The arguments used for the target-effect interface and the target-effect API.
   */
  args: TTargetArg[]
}

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
type TTargetArg = TTargetArgCommon &
  (
    | TTargetBooleanArg
    | TTargetNumberArg
    | TTargetStringArg
    | TTargetMedCharStringArg
    | TTargetDropdownArg
  )
