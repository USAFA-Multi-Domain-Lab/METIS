import type { TBaseTargetParameter, TBaseTargetParameterJson } from '../types'
import { TargetParameter } from './TargetParameter'

/**
 * The dropdown argument type for a target.
 */
export class DropdownTargetParameter {
  /**
   * Converts TDropdownArg to TDropdownArgJson.
   * @param arg The dropdown argument to convert.
   * @returns The dropdown argument as JSON.
   */
  public static toJson = (arg: TDropdownTargetParameter): TDropdownTargetParameterJson => {
    // Return the appropriate properties based on
    // whether the argument is required or not.
    return arg.required
      ? {
          _id: arg._id,
          name: arg.name,
          groupingId: arg.groupingId,
          dependencies: arg.dependencies
            ? TargetParameter.encodeDependencies(arg.dependencies)
            : undefined,
          tooltipDescription: arg.tooltipDescription,
          type: arg.type,
          required: arg.required,
          default: DropdownTargetParameter.OPTION_TO_JSON(arg.default),
          options: DropdownTargetParameter.OPTIONS_TO_JSON(arg.options),
        }
      : {
          _id: arg._id,
          name: arg.name,
          groupingId: arg.groupingId,
          dependencies: arg.dependencies
            ? TargetParameter.encodeDependencies(arg.dependencies)
            : undefined,
          tooltipDescription: arg.tooltipDescription,
          type: arg.type,
          required: arg.required,
          options: DropdownTargetParameter.OPTIONS_TO_JSON(arg.options),
        }
  }

  /**
   * Converts TDropdownArg options to TDropdownArgJson options.
   * @param options The dropdown argument options to convert.
   * @returns The dropdown argument options as JSON.
   */
  public static OPTIONS_TO_JSON<T extends TDropdownTargetParameterOptionVal>(
    options: TDropdownTargetParameterOption<T>[],
  ): TDropdownTargetParameterOptionJson<T>[] {
    return options.map((option) => {
      return {
        _id: option._id,
        name: option.name,
        value: option.value,
      }
    })
  }
  /**
   * Converts TDropdownArgOption to TDropdownTargetParameterOptionJson.
   * @param option The dropdown argument option to convert.
   * @returns The dropdown argument option as JSON.
   */
  public static OPTION_TO_JSON<T extends TDropdownTargetParameterOptionVal>(
    option: TDropdownTargetParameterOption<T>,
  ): TDropdownTargetParameterOptionJson<T> {
    return {
      _id: option._id,
      name: option.name,
      value: option.value,
    }
  }

  /**
   * Converts TDropdownArgJson to TDropdownTargetParameter.
   * @param arg The dropdown argument as JSON to convert.
   * @returns The dropdown argument.
   */
  public static fromJson = (arg: TDropdownTargetParameterJson): TDropdownTargetParameter => {
    // Return the appropriate properties based on
    // whether the argument is required or not.
    return arg.required
      ? {
          _id: arg._id,
          name: arg.name,
          groupingId: arg.groupingId,
          dependencies: arg.dependencies
            ? TargetParameter.decodeDependencies(arg.dependencies)
            : undefined,
          tooltipDescription: arg.tooltipDescription,
          type: arg.type,
          required: arg.required,
          default: DropdownTargetParameter.OPTION_FROM_JSON(arg.default),
          options: DropdownTargetParameter.OPTIONS_FROM_JSON(arg.options),
        }
      : {
          _id: arg._id,
          name: arg.name,
          groupingId: arg.groupingId,
          dependencies: arg.dependencies
            ? TargetParameter.decodeDependencies(arg.dependencies)
            : undefined,
          tooltipDescription: arg.tooltipDescription,
          type: arg.type,
          required: arg.required,
          options: DropdownTargetParameter.OPTIONS_FROM_JSON(arg.options),
        }
  }
  /**
   * Converts TDropdownArgJson options to TDropdownArg options.
   * @param options The dropdown argument options as JSON to convert.
   * @returns The dropdown argument options.
   */
  public static OPTIONS_FROM_JSON<T extends TDropdownTargetParameterOptionVal>(
    options: TDropdownTargetParameterOptionJson<T>[],
  ): TDropdownTargetParameterOption<T>[] {
    return options.map((option) => {
      return {
        _id: option._id,
        name: option.name,
        value: option.value,
      }
    })
  }
  /**
   * Converts TDropdownTargetParameterOptionJson to TDropdownArgOption.
   * @param option The dropdown argument option as JSON to convert.
   * @returns The dropdown argument option.
   */
  public static OPTION_FROM_JSON<T extends TDropdownTargetParameterOptionVal>(
    option: TDropdownTargetParameterOptionJson<T>,
  ): TDropdownTargetParameterOption<T> {
    return {
      _id: option._id,
      name: option.name,
      value: option.value,
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
export type TDropdownTargetParameter = TBaseTargetParameter &
  (TDropdownTargetParameterOptional | TDropdownTargetParameterRequired) & {
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
type TDropdownTargetParameterOptional = {
  /**
   * Determines whether the argument is required or not.
   */
  required: false
  /**
   * The options for the argument.
   */
  options: TDropdownTargetParameterOption<TOptDropdownTargetParameterOptionVal>[]
}
/**
 * The required dropdown argument type for a target.
 */
type TDropdownTargetParameterRequired = {
  /**
   * Determines whether the argument is required or not.
   */
  required: true
  /**
   * The options for the argument.
   */
  options: TDropdownTargetParameterOption<TReqDropdownTargetParameterOptionVal>[]
  /**
   * The default value for the argument.
   */
  default: TDropdownTargetParameterOption<TReqDropdownTargetParameterOptionVal>
}
/**
 * The dropdown argument option type for a target.
 */
export type TDropdownTargetParameterOption<
  Value extends TDropdownTargetParameterOptionVal = TDropdownTargetParameterOptionVal,
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
}
/**
 * The dropdown argument type for a target.
 */
export type TDropdownTargetParameterJson = TBaseTargetParameterJson &
  (TDropdownTargetParameterOptionalJson | TDropdownTargetParameterRequiredJson) & {
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
type TDropdownTargetParameterOptionalJson = {
  /**
   * Determines whether the argument is required or not.
   */
  required: false
  /**
   * The options for the argument.
   */
  options: TDropdownTargetParameterOptionJson<TOptDropdownTargetParameterOptionVal>[]
}
/**
 * The required dropdown argument type for a target as JSON.
 */
type TDropdownTargetParameterRequiredJson = {
  /**
   * Determines whether the argument is required or not.
   */
  required: true
  /**
   * The default value for the argument.
   */
  default: TDropdownTargetParameterOptionJson<TReqDropdownTargetParameterOptionVal>
  /**
   * The options for the argument.
   */
  options: TDropdownTargetParameterOptionJson<TReqDropdownTargetParameterOptionVal>[]
}
/**
 * The dropdown argument option type for a target.
 */
export type TDropdownTargetParameterOptionJson<
  Value extends TDropdownTargetParameterOptionVal = TDropdownTargetParameterOptionVal,
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
}

/**
 * The option value types for a required dropdown argument.
 */
export type TReqDropdownTargetParameterOptionVal = string | number | boolean | object

/**
 * The option value types for an optional dropdown argument.
 */
export type TOptDropdownTargetParameterOptionVal =
  | string
  | number
  | boolean
  | object
  | null
  | undefined

/**
 * The option value types for a dropdown argument.
 */
export type TDropdownTargetParameterOptionVal =
  | TReqDropdownTargetParameterOptionVal
  | TOptDropdownTargetParameterOptionVal
