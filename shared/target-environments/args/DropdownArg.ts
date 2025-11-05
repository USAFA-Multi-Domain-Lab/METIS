import type { TargetDependency } from '../targets/TargetDependency'
import type { TBaseArg, TBaseArgJson } from '../types'
import { Arg } from './Arg'

/**
 * The dropdown argument type for a target.
 */
export class DropdownArg {
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
  public static OPTIONS_TO_JSON<T extends TDropdownArgOptionVal>(
    options: TDropdownArgOption<T>[],
  ): TDropdownArgOptionJson<T>[] {
    return options.map((option) => {
      return {
        _id: option._id,
        name: option.name,
        value: option.value,
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
  public static OPTION_TO_JSON<T extends TDropdownArgOptionVal>(
    option: TDropdownArgOption<T>,
  ): TDropdownArgOptionJson<T> {
    return {
      _id: option._id,
      name: option.name,
      value: option.value,
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
  public static OPTIONS_FROM_JSON<T extends TDropdownArgOptionVal>(
    options: TDropdownArgOptionJson<T>[],
  ): TDropdownArgOption<T>[] {
    return options.map((option) => {
      return {
        _id: option._id,
        name: option.name,
        value: option.value,
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
  public static OPTION_FROM_JSON<T extends TDropdownArgOptionVal>(
    option: TDropdownArgOptionJson<T>,
  ): TDropdownArgOption<T> {
    return {
      _id: option._id,
      name: option.name,
      value: option.value,
      dependencies: option.dependencies
        ? Arg.decodeDependencies(option.dependencies)
        : undefined,
    }
  }
  /**
   * The dropdown argument option value types.
   */
  public static readonly OPTION_VALUE_TYPES = [
    'string',
    'number',
    'boolean',
    'object',
    'undefined',
  ]
}

/* -- TYPES -- */

/**
 * The dropdown argument type for a target.
 */
export type TDropdownArg = TBaseArg &
  (TDropdownArgOptional | TDropdownArgRequired) & {
    /**
     * The argument's input type.
     * @note This will render as a dropdown box with
     * predefined options for the user to select from.
     * @note See example below as to how the data is built
     * for the target's script.
     * @example
     * ```typescript
     * // This data is used to render a dropdown box with
     * // two predefined options for the user to select from.
     * // See below for how the data will be built for the target's script.
     *
     * {
     *   _id: 'argument1',
     *   name: 'Argument 1',
     *   required: false,
     *   groupingId: 'argument',
     *   type: 'dropdown',
     *   options: [
     *     {
     *       _id: 'option1',
     *       name: 'Option 1',
     *       value: 1,
     *     },
     *     {
     *       _id: 'option2',
     *       name: 'Option 2',
     *       value: 2,
     *     },
     *   ],
     * }
     *
     * // Once the dropdown box is rendered, the user will be able to select
     * // either 'Option 1' or 'Option 2'. If the user selects 'Option 1',
     * // the value in the effect's arguments will look like this:
     * {
     *   argument1: 1,
     * }
     *
     * // If the user selects 'Option 2', the value in the effect's arguments
     * // will look like this:
     * {
     *   argument1: 2,
     * }
     * ```
     */
    type: 'dropdown'
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
   * The options for the argument.
   */
  options: TDropdownArgOption<TOptDropdownArgOptionVal>[]
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
   * The options for the argument.
   */
  options: TDropdownArgOption<TReqDropdownArgOptionVal>[]
  /**
   * The default value for the argument.
   */
  default: TDropdownArgOption<TReqDropdownArgOptionVal>
}
/**
 * The dropdown argument option type for a target.
 */
export type TDropdownArgOption<
  Value extends TDropdownArgOptionVal = TDropdownArgOptionVal,
> = {
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
   * The option's value.
   * @note This is the dropdown's value when the option is selected.
   * This value is added to the effect's arguments when the option is selected.
   * @see The example below as to how the data is built
   * for the target's script.
   * @example
   * ```typescript
   * // This data is used to render a dropdown box with
   * // two predefined options for the user to select from.
   * // See below for how the data will be built for the target's script.
   *
   * {
   *   _id: 'argument1',
   *   name: 'Argument 1',
   *   required: false,
   *   groupingId: 'argument',
   *   type: 'dropdown',
   *   options: [
   *     {
   *       _id: 'option1',
   *       name: 'Option 1',
   *       value: 1,
   *     },
   *     {
   *       _id: 'option2',
   *       name: 'Option 2',
   *       value: 2,
   *     },
   *   ],
   * }
   *
   * // Once the dropdown box is rendered, the user will be able to select
   * // either 'Option 1' or 'Option 2'. If the user selects 'Option 1',
   * // the value in the effect's arguments will look like this:
   * {
   *   argument1: 1,
   * }
   *
   * // If the user selects 'Option 2', the value in the effect's arguments
   * // will look like this:
   * {
   *   argument1: 2,
   * }
   * ```
   */
  value: Value
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
   *       dependencies: [Dependency.SOME('argument1', [1, 2, 3])],
   *     },
   *    // Note: The argument itself is only displayed if the value of 'argument1' is equal to 1, 2, or 3.
   *    dependencies: [Dependency.SOME('argument1', [1, 2, 3])],
   * }
   * ```
   */
  dependencies?: TargetDependency[]
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
     * @note See example below as to how the data is built
     * for the target's script.
     * @example
     * ```typescript
     * // This data is used to render a dropdown box with
     * // two predefined options for the user to select from.
     * // See below for how the data will be built for the target's script.
     *
     * {
     *   _id: 'argument1',
     *   name: 'Argument 1',
     *   required: false,
     *   groupingId: 'argument',
     *   type: 'dropdown',
     *   options: [
     *     {
     *       _id: 'option1',
     *       name: 'Option 1',
     *       value: 1,
     *     },
     *     {
     *       _id: 'option2',
     *       name: 'Option 2',
     *       value: 2,
     *     },
     *   ],
     * }
     *
     * // Once the dropdown box is rendered, the user will be able to select
     * // either 'Option 1' or 'Option 2'. If the user selects 'Option 1',
     * // the value in the effect's arguments will look like this:
     * {
     *   argument1: 1,
     * }
     *
     * // If the user selects 'Option 2', the value in the effect's arguments
     * // will look like this:
     * {
     *   argument1: 2,
     * }
     * ```
     */
    type: 'dropdown'
  }
/**
 * The optional dropdown argument type for a target.
 */
type TDropdownArgOptionalJson = {
  /**
   * Determines whether the argument is required or not.
   */
  required: false
  /**
   * The options for the argument.
   */
  options: TDropdownArgOptionJson<TOptDropdownArgOptionVal>[]
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
  default: TDropdownArgOptionJson<TReqDropdownArgOptionVal>
  /**
   * The options for the argument.
   */
  options: TDropdownArgOptionJson<TReqDropdownArgOptionVal>[]
}
/**
 * The dropdown argument option type for a target.
 */
export type TDropdownArgOptionJson<
  Value extends TDropdownArgOptionVal = TDropdownArgOptionVal,
> = {
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
   * The option's value.
   * @note This is the dropdown's value when the option is selected.
   * This value is added to the effect's arguments when the option is selected.
   * @see The example below as to how the data is built
   * for the target's script.
   * @example
   * ```typescript
   * // This data is used to render a dropdown box with
   * // two predefined options for the user to select from.
   * // See below for how the data will be built for the target's script.
   *
   * {
   *   _id: 'argument1',
   *   name: 'Argument 1',
   *   required: false,
   *   groupingId: 'argument',
   *   type: 'dropdown',
   *   options: [
   *     {
   *       _id: 'option1',
   *       name: 'Option 1',
   *       value: 1,
   *     },
   *     {
   *       _id: 'option2',
   *       name: 'Option 2',
   *       value: 2,
   *     },
   *   ],
   * }
   *
   * // Once the dropdown box is rendered, the user will be able to select
   * // either 'Option 1' or 'Option 2'. If the user selects 'Option 1',
   * // the value in the effect's arguments will look like this:
   * {
   *   argument1: 1,
   * }
   *
   * // If the user selects 'Option 2', the value in the effect's arguments
   * // will look like this:
   * {
   *   argument1: 2,
   * }
   * ```
   */
  value: Value
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
   *       dependencies: [Dependency.SOME('argument1', [1, 2, 3])],
   *     },
   *    // Note: The argument itself is only displayed if the value of 'argument1' is equal to 1, 2, or 3.
   *    dependencies: [Dependency.SOME('argument1', [1, 2, 3])],
   * }
   * ```
   */
  dependencies?: string[]
}

/**
 * The option value types for a required dropdown argument.
 */
export type TReqDropdownArgOptionVal = string | number | boolean | object

/**
 * The option value types for an optional dropdown argument.
 */
export type TOptDropdownArgOptionVal =
  | string
  | number
  | boolean
  | object
  | null
  | undefined

/**
 * The option value types for a dropdown argument.
 */
export type TDropdownArgOptionVal =
  | TReqDropdownArgOptionVal
  | TOptDropdownArgOptionVal
