import Arg, { TBaseArg, TBaseArgJson } from '.'
import Dependency from '../dependencies'

/**
 * The dropdown argument type for a target.
 */
export default class DropdownArg {
  /**
   * Converts TDropdownArg to TDropdownArgJson.
   * @param arg The dropdown argument to convert.
   * @returns The dropdown argument as JSON.
   */
  public static toJson = (arg: TDropdownArg): TDropdownArgJson => {
    // Return the appropriate properties based on
    // whether the argument is required or not.
    return arg.required
      ? {
          _id: arg._id,
          name: arg.name,
          groupingId: arg.groupingId,
          dependencies: arg.dependencies
            ? Arg.encodeDependencies(arg.dependencies)
            : undefined,
          tooltipDescription: arg.tooltipDescription,
          type: arg.type,
          required: arg.required,
          default: DropdownArg.OPTION_TO_JSON(arg.default),
          options: DropdownArg.OPTIONS_TO_JSON(arg.options),
        }
      : {
          _id: arg._id,
          name: arg.name,
          groupingId: arg.groupingId,
          dependencies: arg.dependencies
            ? Arg.encodeDependencies(arg.dependencies)
            : undefined,
          tooltipDescription: arg.tooltipDescription,
          type: arg.type,
          required: arg.required,
          options: DropdownArg.OPTIONS_TO_JSON(arg.options),
        }
  }

  /**
   * Converts TDropdownArg options to TDropdownArgJson options.
   * @param options The dropdown argument options to convert.
   * @returns The dropdown argument options as JSON.
   */
  public static OPTIONS_TO_JSON = (
    options: TDropdownArgOption[],
  ): TDropdownArgOptionJson[] => {
    return options.map((option) => {
      return {
        _id: option._id,
        name: option.name,
        dependencies: option.dependencies
          ? Arg.encodeDependencies(option.dependencies)
          : undefined,
      }
    })
  }
  /**
   * Converts TDropdownArgOption to TDropdownArgOptionJson.
   * @param option The dropdown argument option to convert.
   * @returns The dropdown argument option as JSON.
   */
  public static OPTION_TO_JSON = (
    option: TDropdownArgOption,
  ): TDropdownArgOptionJson => {
    return {
      _id: option._id,
      name: option.name,
      dependencies: option.dependencies
        ? Arg.encodeDependencies(option.dependencies)
        : undefined,
    }
  }

  /**
   * Converts TDropdownArgJson to TDropdownArg.
   * @param arg The dropdown argument as JSON to convert.
   * @returns The dropdown argument.
   */
  public static fromJson = (arg: TDropdownArgJson): TDropdownArg => {
    // Return the appropriate properties based on
    // whether the argument is required or not.
    return arg.required
      ? {
          _id: arg._id,
          name: arg.name,
          groupingId: arg.groupingId,
          dependencies: arg.dependencies
            ? Arg.decodeDependencies(arg.dependencies)
            : undefined,
          tooltipDescription: arg.tooltipDescription,
          type: arg.type,
          required: arg.required,
          default: DropdownArg.OPTION_FROM_JSON(arg.default),
          options: DropdownArg.OPTIONS_FROM_JSON(arg.options),
        }
      : {
          _id: arg._id,
          name: arg.name,
          groupingId: arg.groupingId,
          dependencies: arg.dependencies
            ? Arg.decodeDependencies(arg.dependencies)
            : undefined,
          tooltipDescription: arg.tooltipDescription,
          type: arg.type,
          required: arg.required,
          options: DropdownArg.OPTIONS_FROM_JSON(arg.options),
        }
  }
  /**
   * Converts TDropdownArgJson options to TDropdownArg options.
   * @param options The dropdown argument options as JSON to convert.
   * @returns The dropdown argument options.
   */
  public static OPTIONS_FROM_JSON = (
    options: TDropdownArgOptionJson[],
  ): TDropdownArgOption[] => {
    return options.map((option) => {
      return {
        _id: option._id,
        name: option.name,
        dependencies: option.dependencies
          ? Arg.decodeDependencies(option.dependencies)
          : undefined,
      }
    })
  }
  /**
   * Converts TDropdownArgOptionJson to TDropdownArgOption.
   * @param option The dropdown argument option as JSON to convert.
   * @returns The dropdown argument option.
   */
  public static OPTION_FROM_JSON = (
    option: TDropdownArgOptionJson,
  ): TDropdownArgOption => {
    return {
      _id: option._id,
      name: option.name,
      dependencies: option.dependencies
        ? Arg.decodeDependencies(option.dependencies)
        : undefined,
    }
  }
}

/* ------------------------------ DROPDOWN ARGUMENT TYPES ------------------------------ */

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
    options: TDropdownArgOption[]
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
  default: TDropdownArgOption
}
/**
 * The dropdown argument option type for a target.
 */
export type TDropdownArgOption = {
  /**
   * The ID of the option.
   */
  _id: string
  /**
   * The option's name.
   * @note This is displayed to the user.
   */
  name: string
  /**
   * These are the keys of the arguments that the current option depends on.
   * @note If the option depends on another argument, the option will only be displayed in the dropdown list if the dependency is met.
   * @note If the option depends on multiple arguments, all dependencies must be met for the option to be displayed in the dropdown list.
   * @note If the dependency has no dependencies (i.e. set to `undefined` or `[]`), the option will always be displayed in the dropdown list.
   * @default undefined
   * @example
   * ```typescript
   * // This option is always displayed because it has no dependencies.
   * // Note: The argument itself is also always displayed because it has no dependencies as well.
   * {
   *    _id: 'argument1',
   *    name: 'Argument 1',
   *    required: false,
   *    groupingId: 'argument',
   *    type: 'dropdown',
   *    options: [
   *      {
   *       _id: 'option1',
   *       name: 'Option 1',
   *     },
   * },
   * {
   *    _id: 'argument2',
   *    name: 'Argument 2',
   *    required: false,
   *    groupingId: 'argument',
   *    type: 'dropdown',
   *    options: [
   *      {
   *       _id: 'option1',
   *       name: 'Option 1',
   *       // This option is only displayed if the value of 'argument1' is truthy (i.e. 1, 'a', true, etc.)
   *       // or not falsy (i.e. null, undefined, 0, false, '', etc.).
   *       dependencies: [Dependency.TRUTHY('argument1')],
   *     },
   *    // Note: The argument itself is only displayed if the value of 'argument1' is truthy (i.e. 1, 'a', true, etc.)
   *    // or not falsy (i.e. null, undefined, 0, false, '', etc.).
   *    dependencies: [Dependency.TRUTHY('argument1')],
   * }
   * ```
   *
   * @example
   * ```typescript
   * // This option is always displayed because it has no dependencies.
   * // Note: The argument itself is also always displayed because it has no dependencies as well.
   * {
   *    _id: 'argument1',
   *    name: 'Argument 1',
   *    required: false,
   *    groupingId: 'argument',
   *    type: 'dropdown',
   *    options: [
   *      {
   *       _id: 'option1',
   *       name: 'Option 1',
   *     },
   * },
   * {
   *    _id: 'argument2',
   *    name: 'Argument 2',
   *    required: false,
   *    groupingId: 'argument',
   *    type: 'dropdown',
   *    options: [
   *      {
   *       _id: 'option1',
   *       name: 'Option 1',
   *       // This option is only displayed if the value of 'argument1' is equal to 1, 2, or 3.
   *       dependencies: [Dependency.EQUALS('argument1', [1, 2, 3])],
   *     },
   *    // Note: The argument itself is only displayed if the value of 'argument1' is equal to 1, 2, or 3.
   *    dependencies: [Dependency.EQUALS('argument1', [1, 2, 3])],
   * }
   * ```
   */
  dependencies?: Dependency[]
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
    options: TDropdownArgOptionJson[]
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
 * The required dropdown argument type for a target as JSON.
 */
type TDropdownArgRequiredJson = {
  /**
   * Determines whether the argument is required or not.
   */
  required: true
  /**
   * The default value for the argument.
   */
  default: TDropdownArgOptionJson
}
/**
 * The dropdown argument option type for a target.
 */
export type TDropdownArgOptionJson = {
  /**
   * The ID of the option.
   */
  _id: string
  /**
   * The option's name.
   * @note This is displayed to the user.
   */
  name: string
  /**
   * These are the keys of the arguments that the current option depends on.
   * @note If the option depends on another argument, the option will only be displayed in the dropdown list if the dependency is met.
   * @note If the option depends on multiple arguments, all dependencies must be met for the option to be displayed in the dropdown list.
   * @note If the dependency has no dependencies (i.e. set to `undefined` or `[]`), the option will always be displayed in the dropdown list.
   * @default undefined
   * @example
   * ```typescript
   * // This option is always displayed because it has no dependencies.
   * // Note: The argument itself is also always displayed because it has no dependencies as well.
   * {
   *    _id: 'argument1',
   *    name: 'Argument 1',
   *    required: false,
   *    groupingId: 'argument',
   *    type: 'dropdown',
   *    options: [
   *      {
   *       _id: 'option1',
   *       name: 'Option 1',
   *     },
   * },
   * {
   *    _id: 'argument2',
   *    name: 'Argument 2',
   *    required: false,
   *    groupingId: 'argument',
   *    type: 'dropdown',
   *    options: [
   *      {
   *       _id: 'option1',
   *       name: 'Option 1',
   *       // This option is only displayed if the value of 'argument1' is truthy (i.e. 1, 'a', true, etc.)
   *       // or not falsy (i.e. null, undefined, 0, false, '', etc.).
   *       dependencies: [Dependency.TRUTHY('argument1')],
   *     },
   *    // Note: The argument itself is only displayed if the value of 'argument1' is truthy (i.e. 1, 'a', true, etc.)
   *    // or not falsy (i.e. null, undefined, 0, false, '', etc.).
   *    dependencies: [Dependency.TRUTHY('argument1')],
   * }
   * ```
   *
   * @example
   * ```typescript
   * // This option is always displayed because it has no dependencies.
   * // Note: The argument itself is also always displayed because it has no dependencies as well.
   * {
   *    _id: 'argument1',
   *    name: 'Argument 1',
   *    required: false,
   *    groupingId: 'argument',
   *    type: 'dropdown',
   *    options: [
   *      {
   *       _id: 'option1',
   *       name: 'Option 1',
   *     },
   * },
   * {
   *    _id: 'argument2',
   *    name: 'Argument 2',
   *    required: false,
   *    groupingId: 'argument',
   *    type: 'dropdown',
   *    options: [
   *      {
   *       _id: 'option1',
   *       name: 'Option 1',
   *       // This option is only displayed if the value of 'argument1' is equal to 1, 2, or 3.
   *       dependencies: [Dependency.EQUALS('argument1', [1, 2, 3])],
   *     },
   *    // Note: The argument itself is only displayed if the value of 'argument1' is equal to 1, 2, or 3.
   *    dependencies: [Dependency.EQUALS('argument1', [1, 2, 3])],
   * }
   * ```
   */
  dependencies?: string[]
}
