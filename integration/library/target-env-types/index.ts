/* ---------------------------------- TARGET ENV TYPES -------------------------------------- */

/**
 * Represents a target environment.
 */
export type TTargetEnv = {
  /**
   * The ID of the target environment.
   */
  _id: string
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
}

/* ---------------------------------- TARGET TYPES -------------------------------------- */

/**
 * Represents a target.
 */
export type TTarget = {
  /**
   * The ID of the target.
   */
  _id: string
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
  /**
   * The default value for the argument.
   * @default { _id: 'default', name: 'Select an option' }
   */
  default?: {
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
  /**
   * The default value for the argument.
   * @default false
   */
  default?: boolean
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
type TTargetArg =
  | TNumberArg
  | TStringArg
  | TLargeStringArg
  | TDropdownArg
  | TBooleanArg
