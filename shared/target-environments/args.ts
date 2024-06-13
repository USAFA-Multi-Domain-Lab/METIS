import { Dependency } from './dependencies'

/**
 * Arguments for a target.
 */
export default class Args {
  /**
   * Decodes the argument dependencies.
   * @param dependencies The dependencies to decode.
   * @returns The decoded dependencies.
   */
  private static decodeArgDependencies = (
    dependencies: string[],
  ): Dependency[] => {
    return dependencies.map((dependency: string) => {
      return Dependency.decode(dependency)
    })
  }

  /**
   * Encodes the argument dependencies.
   * @param dependencies The dependencies to encode.
   * @returns The encoded dependencies.
   */
  private static encodeArgDependencies = (
    dependencies: Dependency[],
  ): string[] => {
    return dependencies.map((dependency: Dependency) => {
      return dependency.encode()
    })
  }

  /**
   * Converts arguments to JSON.
   * @param args The arguments to convert.
   * @returns The arguments as JSON.
   */
  public static toJson = (args: TTargetArg[]): TTargetArgJson[] => {
    return args.map((arg: TTargetArg) => {
      switch (arg.type) {
        case 'number':
          return Args.NUMBER_ARG_TO_JSON(arg)
        case 'string':
          return Args.STRING_ARG_TO_JSON(arg)
        case 'large-string':
          return Args.LARGE_STRING_ARG_TO_JSON(arg)
        case 'dropdown':
          return Args.DROPDOWN_ARG_TO_JSON(arg)
        case 'boolean':
          return Args.BOOLEAN_ARG_TO_JSON(arg)
      }
    })
  }

  /**
   * Converts TNumberArg to TNumberArgJson.
   * @param arg The number argument to convert.
   * @returns The number argument as JSON.
   */
  private static NUMBER_ARG_TO_JSON = (arg: TNumberArg): TNumberArgJson =>
    // Return the appropriate properties based on
    // whether the argument is required or not.
    arg.required
      ? {
          _id: arg._id,
          name: arg.name,
          groupingId: arg.groupingId,
          dependencies: arg.dependencies
            ? Args.encodeArgDependencies(arg.dependencies)
            : undefined,
          tooltipDescription: arg.tooltipDescription,
          type: arg.type,
          required: arg.required,
          default: arg.default,
          min: arg.min,
          max: arg.max,
          unit: arg.unit,
        }
      : {
          _id: arg._id,
          name: arg.name,
          groupingId: arg.groupingId,
          dependencies: arg.dependencies
            ? Args.encodeArgDependencies(arg.dependencies)
            : undefined,
          tooltipDescription: arg.tooltipDescription,
          type: arg.type,
          required: arg.required,
          min: arg.min,
          max: arg.max,
          unit: arg.unit,
        }

  /**
   * Converts TStringArg to TStringArgJson.
   * @param arg The string argument to convert.
   * @returns The string argument as JSON.
   */
  private static STRING_ARG_TO_JSON = (arg: TStringArg): TStringArgJson =>
    // Return the appropriate properties based on
    // whether the argument is required or not.
    arg.required
      ? {
          _id: arg._id,
          name: arg.name,
          groupingId: arg.groupingId,
          dependencies: arg.dependencies
            ? Args.encodeArgDependencies(arg.dependencies)
            : undefined,
          tooltipDescription: arg.tooltipDescription,
          type: arg.type,
          required: arg.required,
          default: arg.default,
        }
      : {
          _id: arg._id,
          name: arg.name,
          groupingId: arg.groupingId,
          dependencies: arg.dependencies
            ? Args.encodeArgDependencies(arg.dependencies)
            : undefined,
          tooltipDescription: arg.tooltipDescription,
          type: arg.type,
          required: arg.required,
        }

  /**
   * Converts TLargeStringArg to TLargeStringArgJson.
   * @param arg The large string argument to convert.
   * @returns The large string argument as JSON.
   */
  private static LARGE_STRING_ARG_TO_JSON = (
    arg: TLargeStringArg,
  ): TLargeStringArgJson =>
    // Return the appropriate properties based on
    // whether the argument is required or not.
    arg.required
      ? {
          _id: arg._id,
          name: arg.name,
          groupingId: arg.groupingId,
          dependencies: arg.dependencies
            ? Args.encodeArgDependencies(arg.dependencies)
            : undefined,
          tooltipDescription: arg.tooltipDescription,
          type: arg.type,
          required: arg.required,
          default: arg.default,
        }
      : {
          _id: arg._id,
          name: arg.name,
          groupingId: arg.groupingId,
          dependencies: arg.dependencies
            ? Args.encodeArgDependencies(arg.dependencies)
            : undefined,
          tooltipDescription: arg.tooltipDescription,
          type: arg.type,
          required: arg.required,
        }

  /**
   * Converts TDropdownArg to TDropdownArgJson.
   * @param arg The dropdown argument to convert.
   * @returns The dropdown argument as JSON.
   */
  private static DROPDOWN_ARG_TO_JSON = (arg: TDropdownArg): TDropdownArgJson =>
    // Return the appropriate properties based on
    // whether the argument is required or not.
    arg.required
      ? {
          _id: arg._id,
          name: arg.name,
          groupingId: arg.groupingId,
          dependencies: arg.dependencies
            ? Args.encodeArgDependencies(arg.dependencies)
            : undefined,
          tooltipDescription: arg.tooltipDescription,
          type: arg.type,
          required: arg.required,
          default: arg.default,
          options: arg.options,
        }
      : {
          _id: arg._id,
          name: arg.name,
          groupingId: arg.groupingId,
          dependencies: arg.dependencies
            ? Args.encodeArgDependencies(arg.dependencies)
            : undefined,
          tooltipDescription: arg.tooltipDescription,
          type: arg.type,
          required: arg.required,
          options: arg.options,
        }

  /**
   * Converts TBooleanArg to TBooleanArgJson.
   * @param arg The boolean argument to convert.
   * @returns The boolean argument as JSON.
   */
  private static BOOLEAN_ARG_TO_JSON = (arg: TBooleanArg): TBooleanArgJson =>
    // Return the appropriate properties based on
    // whether the argument is required or not.
    arg.required
      ? {
          _id: arg._id,
          name: arg.name,
          groupingId: arg.groupingId,
          dependencies: arg.dependencies
            ? Args.encodeArgDependencies(arg.dependencies)
            : undefined,
          tooltipDescription: arg.tooltipDescription,
          type: arg.type,
          required: arg.required,
          default: arg.default,
        }
      : {
          _id: arg._id,
          name: arg.name,
          groupingId: arg.groupingId,
          dependencies: arg.dependencies
            ? Args.encodeArgDependencies(arg.dependencies)
            : undefined,
          tooltipDescription: arg.tooltipDescription,
          type: arg.type,
          required: arg.required,
        }

  /**
   * Converts arguments from JSON.
   * @param args The arguments as JSON to convert.
   * @returns The arguments.
   */
  public static fromJson = (args: TTargetArgJson[]): TTargetArg[] => {
    return args.map((arg: TTargetArgJson) => {
      switch (arg.type) {
        case 'number':
          return Args.NUMBER_ARG_FROM_JSON(arg)
        case 'string':
          return Args.STRING_ARG_FROM_JSON(arg)
        case 'large-string':
          return Args.LARGE_STRING_ARG_FROM_JSON(arg)
        case 'dropdown':
          return Args.DROPDOWN_ARG_FROM_JSON(arg)
        case 'boolean':
          return Args.BOOLEAN_ARG_FROM_JSON(arg)
      }
    })
  }

  /**
   * Converts TNumberArgJson to TNumberArg.
   * @param arg The number argument as JSON to convert.
   * @returns The number argument.
   */
  private static NUMBER_ARG_FROM_JSON = (arg: TNumberArgJson): TNumberArg =>
    // Return the appropriate properties based on
    // whether the argument is required or not.
    arg.required
      ? {
          _id: arg._id,
          name: arg.name,
          groupingId: arg.groupingId,
          dependencies: arg.dependencies
            ? Args.decodeArgDependencies(arg.dependencies)
            : undefined,
          tooltipDescription: arg.tooltipDescription,
          type: arg.type,
          required: arg.required,
          default: arg.default,
          min: arg.min,
          max: arg.max,
          unit: arg.unit,
        }
      : {
          _id: arg._id,
          name: arg.name,
          groupingId: arg.groupingId,
          dependencies: arg.dependencies
            ? Args.decodeArgDependencies(arg.dependencies)
            : undefined,
          tooltipDescription: arg.tooltipDescription,
          type: arg.type,
          required: arg.required,
          min: arg.min,
          max: arg.max,
          unit: arg.unit,
        }

  /**
   * Converts TStringArgJson to TStringArg.
   * @param arg The string argument as JSON to convert.
   * @returns The string argument.
   */
  private static STRING_ARG_FROM_JSON = (arg: TStringArgJson): TStringArg =>
    // Return the appropriate properties based on
    // whether the argument is required or not.
    arg.required
      ? {
          _id: arg._id,
          name: arg.name,
          groupingId: arg.groupingId,
          dependencies: arg.dependencies
            ? Args.decodeArgDependencies(arg.dependencies)
            : undefined,
          tooltipDescription: arg.tooltipDescription,
          type: arg.type,
          required: arg.required,
          default: arg.default,
        }
      : {
          _id: arg._id,
          name: arg.name,
          groupingId: arg.groupingId,
          dependencies: arg.dependencies
            ? Args.decodeArgDependencies(arg.dependencies)
            : undefined,
          tooltipDescription: arg.tooltipDescription,
          type: arg.type,
          required: arg.required,
        }

  /**
   * Converts TLargeStringArgJson to TLargeStringArg.
   * @param arg The large string argument as JSON to convert.
   * @returns The large string argument.
   */
  private static LARGE_STRING_ARG_FROM_JSON = (
    arg: TLargeStringArgJson,
  ): TLargeStringArg =>
    // Return the appropriate properties based on
    // whether the argument is required or not.
    arg.required
      ? {
          _id: arg._id,
          name: arg.name,
          groupingId: arg.groupingId,
          dependencies: arg.dependencies
            ? Args.decodeArgDependencies(arg.dependencies)
            : undefined,
          tooltipDescription: arg.tooltipDescription,
          type: arg.type,
          required: arg.required,
          default: arg.default,
        }
      : {
          _id: arg._id,
          name: arg.name,
          groupingId: arg.groupingId,
          dependencies: arg.dependencies
            ? Args.decodeArgDependencies(arg.dependencies)
            : undefined,
          tooltipDescription: arg.tooltipDescription,
          type: arg.type,
          required: arg.required,
        }

  /**
   * Converts TDropdownArgJson to TDropdownArg.
   * @param arg The dropdown argument as JSON to convert.
   * @returns The dropdown argument.
   */
  private static DROPDOWN_ARG_FROM_JSON = (
    arg: TDropdownArgJson,
  ): TDropdownArg =>
    // Return the appropriate properties based on
    // whether the argument is required or not.
    arg.required
      ? {
          _id: arg._id,
          name: arg.name,
          groupingId: arg.groupingId,
          dependencies: arg.dependencies
            ? Args.decodeArgDependencies(arg.dependencies)
            : undefined,
          tooltipDescription: arg.tooltipDescription,
          type: arg.type,
          required: arg.required,
          default: arg.default,
          options: arg.options,
        }
      : {
          _id: arg._id,
          name: arg.name,
          groupingId: arg.groupingId,
          dependencies: arg.dependencies
            ? Args.decodeArgDependencies(arg.dependencies)
            : undefined,
          tooltipDescription: arg.tooltipDescription,
          type: arg.type,
          required: arg.required,
          options: arg.options,
        }

  /**
   * Converts TBooleanArgJson to TBooleanArg.
   * @param arg The boolean argument as JSON to convert.
   * @returns The boolean argument.
   */
  private static BOOLEAN_ARG_FROM_JSON = (arg: TBooleanArgJson): TBooleanArg =>
    // Return the appropriate properties based on
    // whether the argument is required or not.
    arg.required
      ? {
          _id: arg._id,
          name: arg.name,
          groupingId: arg.groupingId,
          dependencies: arg.dependencies
            ? Args.decodeArgDependencies(arg.dependencies)
            : undefined,
          tooltipDescription: arg.tooltipDescription,
          type: arg.type,
          required: arg.required,
          default: arg.default,
        }
      : {
          _id: arg._id,
          name: arg.name,
          groupingId: arg.groupingId,
          dependencies: arg.dependencies
            ? Args.decodeArgDependencies(arg.dependencies)
            : undefined,
          tooltipDescription: arg.tooltipDescription,
          type: arg.type,
          required: arg.required,
        }
}

/* ------------------------------ TARGET ARGUMENT TYPES ------------------------------ */

/**
 * The base argument type for a target.
 */
export type TBaseArg = {
  /**
   * The ID of the argument.
   */
  _id: string
  /**
   * The argument's name. This is displayed to the user.
   */
  name: string
  /**
   * The grouping ID of the argument.
   * @note This is used to group arguments together in the target-effect interface.
   * @default undefined
   */
  groupingId?: string
  /**
   * These are the keys of the arguments that the current argument depends on.
   * @note If the argument depends on another argument, the argument will only be displayed if the dependency is met.
   * @note If the argument depends on multiple arguments, all dependencies must be met for the argument to be displayed.
   * @note If the argument has no dependencies (i.e. this is left undefined), the argument will always be displayed.
   * @default undefined
   * @example
   * ```typescript
   * // This argument is always displayed because it has no dependencies.
   * {
   *    _id: 'argument1',
   *    name: 'Argument 1',
   *    required: true,
   *    groupingId: 'argument',
   *    type: 'number',
   *    default: 0,
   * },
   * // This argument is only displayed if the value of 'argument1' is not falsy.
   * {
   *    _id: 'argument2',
   *    name: 'Argument 2',
   *    required: false,
   *    groupingId: 'argument',
   *    type: 'number',
   *    dependencies: [Dependency.TRUTHY('argument1')],
   * }
   * ```
   *
   * @example
   * ```typescript
   * // This argument is always displayed because it has no dependencies.
   * {
   *    _id: 'argument1',
   *    name: 'Argument 1',
   *    required: true,
   *    groupingId: 'argument',
   *    type: 'number',
   *    default: 0,
   * },
   * // This argument is only displayed if the value of 'argument1' is equal to 1, 2, or 3.
   * {
   *    _id: 'argument2',
   *    name: 'Argument 2',
   *    required: false,
   *    groupingId: 'argument',
   *    type: 'number',
   *    dependencies: [Dependency.EQUALS('argument1', [1, 2, 3])],
   * }
   * ```
   */
  dependencies?: Dependency[]
  /**
   * This will be used for a hover-over tooltip.
   * @note This can be used to provide additional information or clarification about the argument.
   * @default undefined
   */
  tooltipDescription?: string
}

/**
 * The number argument type for a target.
 */
export type TNumberArg = TBaseArg &
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
export type TStringArg = TBaseArg &
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
export type TLargeStringArg = TBaseArg &
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
export type TDropdownArg = TBaseArg &
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
export type TBooleanArg = TBaseArg &
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

/**
 * The JSON representation of the base argument type for a target.
 */
export type TBaseArgJson = {
  /**
   * The ID of the argument.
   */
  _id: string
  /**
   * The argument's name. This is displayed to the user.
   */
  name: string
  /**
   * The grouping ID of the argument.
   * @note This is used to group arguments together in the target-effect interface.
   * @default undefined
   */
  groupingId?: string
  /**
   * These are the keys of the arguments that the current argument depends on.
   * @note If the argument depends on another argument, the argument will only be displayed if the dependency is met.
   * @note If the argument depends on multiple arguments, all dependencies must be met for the argument to be displayed.
   * @note If the argument has no dependencies (i.e. set to `undefined` or `[]`), the argument will always be displayed.
   * @default undefined
   * @example
   * ```typescript
   * // This argument is always displayed because it has no dependencies.
   * {
   *    _id: 'argument1',
   *    name: 'Argument 1',
   *    required: true,
   *    groupingId: 'argument',
   *    type: 'number',
   *    default: 0,
   * },
   * // This argument is only displayed if the value of 'argument1' is truthy (i.e. 1, 'a', true, etc.)
   * // or not falsy (i.e. null, undefined, 0, false, '', etc.).
   * {
   *    _id: 'argument2',
   *    name: 'Argument 2',
   *    required: false,
   *    groupingId: 'argument',
   *    type: 'number',
   *    dependencies: [Dependency.TRUTHY('argument1')],
   * }
   * ```
   *
   * @example
   * ```typescript
   * // This argument is always displayed because it has no dependencies.
   * {
   *    _id: 'argument1',
   *    name: 'Argument 1',
   *    required: true,
   *    groupingId: 'argument',
   *    type: 'number',
   *    default: 0,
   * },
   * // This argument is only displayed if the value of 'argument1' is equal to 1, 2, or 3.
   * {
   *    _id: 'argument2',
   *    name: 'Argument 2',
   *    required: false,
   *    groupingId: 'argument',
   *    type: 'number',
   *    dependencies: [Dependency.EQUALS('argument1', [1, 2, 3])],
   * }
   * ```
   */
  dependencies?: string[]
  /**
   * This will be used for a hover-over tooltip.
   * @note This can be used to provide additional information or clarification about the argument.
   * @default undefined
   */
  tooltipDescription?: string
}

/**
 * The number argument type for a target.
 */
export type TNumberArgJson = TBaseArgJson &
  (TNumberArgOptionalJson | TNumberArgRequiredJson) & {
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
type TNumberArgOptionalJson = {
  /**
   * Determines whether the argument is required or not.
   */
  required: false
}
/**
 * The required number argument type for a target.
 */
type TNumberArgRequiredJson = {
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
export type TStringArgJson = TBaseArgJson &
  (TStringArgOptionalJson | TStringArgRequiredJson) & {
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
type TStringArgOptionalJson = {
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
type TStringArgRequiredJson = {
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
export type TLargeStringArgJson = TBaseArgJson &
  (TLargeStringArgOptionalJson | TLargeStringArgRequiredJson) & {
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
type TLargeStringArgOptionalJson = {
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
type TLargeStringArgRequiredJson = {
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
export type TDropdownArgJson = TBaseArgJson &
  (TDropdownArgOptionalJson | TDropdownArgRequiredJson) & {
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
type TDropdownArgOptionalJson = {
  /**
   * Determines whether the argument is required or not.
   */
  required: false
}
/**
 * The required dropdown argument type for a target.
 */
type TDropdownArgRequiredJson = {
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
export type TBooleanArgJson = TBaseArgJson &
  (TBooleanArgOptionalJson | TBooleanArgRequiredJson) & {
    /**
     * The argument's input type.
     * @note This will render as a toggle switch.
     */
    type: 'boolean'
  }
/**
 * The optional boolean argument type for a target.
 */
type TBooleanArgOptionalJson = {
  /**
   * Determines whether the argument is required or not.
   */
  required: false
}
/**
 * The required boolean argument type for a target.
 */
type TBooleanArgRequiredJson = {
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
export type TTargetArgJson =
  | TNumberArgJson
  | TStringArgJson
  | TLargeStringArgJson
  | TDropdownArgJson
  | TBooleanArgJson
