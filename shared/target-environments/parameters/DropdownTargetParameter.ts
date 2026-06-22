import type { TBaseTargetParameter, TBaseTargetParameterJson } from '../types'
import { TargetParameter } from './TargetParameter'

/**
 * The dropdown parameter type for a target.
 */
export class DropdownTargetParameter {
  /**
   * Converts TDropdownTargetParameter to TDropdownTargetParameterJson.
   * @param parameter The dropdown parameter to convert.
   * @returns The dropdown parameter as JSON.
   */
  public static toJson = (
    parameter: TDropdownTargetParameter,
  ): TDropdownTargetParameterJson => {
    // Return the appropriate properties based on
    // whether the parameter is required or not.
    return parameter.required
      ? {
          _id: parameter._id,
          name: parameter.name,
          groupingId: parameter.groupingId,
          dependencies: parameter.dependencies
            ? TargetParameter.encodeDependencies(parameter.dependencies)
            : undefined,
          tooltipDescription: parameter.tooltipDescription,
          type: parameter.type,
          required: parameter.required,
          default: parameter.default,
          options: DropdownTargetParameter.OPTIONS_TO_JSON(parameter.options),
        }
      : {
          _id: parameter._id,
          name: parameter.name,
          groupingId: parameter.groupingId,
          dependencies: parameter.dependencies
            ? TargetParameter.encodeDependencies(parameter.dependencies)
            : undefined,
          tooltipDescription: parameter.tooltipDescription,
          type: parameter.type,
          required: parameter.required,
          options: DropdownTargetParameter.OPTIONS_TO_JSON(parameter.options),
        }
  }

  /**
   * Converts TDropdownTargetParameter options to TDropdownTargetParameterJson options.
   * @param options The dropdown parameter options to convert.
   * @returns The dropdown parameter options as JSON.
   */
  public static OPTIONS_TO_JSON<T extends TDropdownTargetParameterOptionVal>(
    options: TDropdownTargetParameterOption<T>[],
  ): TDropdownTargetParameterOptionJson<T>[] {
    return options.map((option) => {
      return {
        _id: option._id,
        name: option.name,
        value: option.value,
        tooltipDescription: option.tooltipDescription,
      }
    })
  }

  /**
   * Converts TDropdownTargetParameterJson to TDropdownTargetParameter.
   * @param parameter The dropdown parameter as JSON to convert.
   * @returns The dropdown parameter.
   */
  public static fromJson = (
    parameter: TDropdownTargetParameterJson,
  ): TDropdownTargetParameter => {
    // Return the appropriate properties based on
    // whether the parameter is required or not.
    return parameter.required
      ? {
          _id: parameter._id,
          name: parameter.name,
          groupingId: parameter.groupingId,
          dependencies: parameter.dependencies
            ? TargetParameter.decodeDependencies(parameter.dependencies)
            : undefined,
          tooltipDescription: parameter.tooltipDescription,
          type: parameter.type,
          required: parameter.required,
          default: parameter.default,
          options: DropdownTargetParameter.OPTIONS_FROM_JSON(parameter.options),
        }
      : {
          _id: parameter._id,
          name: parameter.name,
          groupingId: parameter.groupingId,
          dependencies: parameter.dependencies
            ? TargetParameter.decodeDependencies(parameter.dependencies)
            : undefined,
          tooltipDescription: parameter.tooltipDescription,
          type: parameter.type,
          required: parameter.required,
          options: DropdownTargetParameter.OPTIONS_FROM_JSON(parameter.options),
        }
  }
  /**
   * Converts TDropdownTargetParameterJson options to TDropdownTargetParameter options.
   * @param options The dropdown parameter options as JSON to convert.
   * @returns The dropdown parameter options.
   */
  public static OPTIONS_FROM_JSON<T extends TDropdownTargetParameterOptionVal>(
    options: TDropdownTargetParameterOptionJson<T>[],
  ): TDropdownTargetParameterOption<T>[] {
    return options.map((option) => {
      return {
        _id: option._id,
        name: option.name,
        value: option.value,
        tooltipDescription: option.tooltipDescription,
      }
    })
  }
  /**
   * The dropdown parameter option value types.
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
 * The dropdown parameter type for a target.
 */
export type TDropdownTargetParameter = TBaseTargetParameter &
  (TDropdownTargetParameterOptional | TDropdownTargetParameterRequired) & {
    /**
     * The parameter's input type.
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
     *   _id: 'parameter1',
     *   name: 'Parameter 1',
     *   required: false,
     *   groupingId: 'parameter',
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
     *   parameter1: 1,
     * }
     *
     * // If the user selects 'Option 2', the value in the effect's arguments
     * // will look like this:
     * {
     *   parameter1: 2,
     * }
     * ```
     */
    type: 'dropdown'
  }
/**
 * The optional dropdown parameter type for a target.
 */
type TDropdownTargetParameterOptional = {
  /**
   * Determines whether the parameter is required or not.
   */
  required: false
  /**
   * The options for the parameter.
   */
  options: TDropdownTargetParameterOption<TOptDropdownTargetParameterOptionVal>[]
}
/**
 * The required dropdown parameter type for a target.
 */
type TDropdownTargetParameterRequired = {
  /**
   * Determines whether the parameter is required or not.
   */
  required: true
  /**
   * The options for the parameter.
   */
  options: TDropdownTargetParameterOption<TReqDropdownTargetParameterOptionVal>[]
  /**
   * The `_id` of the option that is selected by default.
   */
  default: string
}
/**
 * The dropdown parameter option type for a target.
 */
export type TDropdownTargetParameterOption<
  Value extends TDropdownTargetParameterOptionVal =
    TDropdownTargetParameterOptionVal,
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
   *   _id: 'parameter1',
   *   name: 'Parameter 1',
   *   required: false,
   *   groupingId: 'parameter',
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
   *   parameter1: 1,
   * }
   *
   * // If the user selects 'Option 2', the value in the effect's arguments
   * // will look like this:
   * {
   *   parameter1: 2,
   * }
   * ```
   */
  value: Value
  /**
   * This will be used for a hover-over tooltip.
   * @note This can be used to provide additional information or clarification about the argument.
   * @default undefined
   */
  tooltipDescription?: string
}
/**
 * The dropdown parameter type for a target.
 */
export type TDropdownTargetParameterJson = TBaseTargetParameterJson &
  (
    | TDropdownTargetParameterOptionalJson
    | TDropdownTargetParameterRequiredJson
  ) & {
    /**
     * The parameter's input type.
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
     *   _id: 'parameter1',
     *   name: 'Parameter 1',
     *   required: false,
     *   groupingId: 'parameter',
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
     *   parameter1: 1,
     * }
     *
     * // If the user selects 'Option 2', the value in the effect's arguments
     * // will look like this:
     * {
     *   parameter1: 2,
     * }
     * ```
     */
    type: 'dropdown'
  }
/**
 * The optional dropdown parameter type for a target.
 */
type TDropdownTargetParameterOptionalJson = {
  /**
   * Determines whether the parameter is required or not.
   */
  required: false
  /**
   * The options for the parameter.
   */
  options: TDropdownTargetParameterOptionJson<TOptDropdownTargetParameterOptionVal>[]
}
/**
 * The required dropdown parameter type for a target as JSON.
 */
type TDropdownTargetParameterRequiredJson = {
  /**
   * Determines whether the parameter is required or not.
   */
  required: true
  /**
   * The `_id` of the option that is selected by default.
   */
  default: string
  /**
   * The options for the parameter.
   */
  options: TDropdownTargetParameterOptionJson<TReqDropdownTargetParameterOptionVal>[]
}
/**
 * The dropdown parameter option type for a target.
 */
export type TDropdownTargetParameterOptionJson<
  Value extends TDropdownTargetParameterOptionVal =
    TDropdownTargetParameterOptionVal,
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
   *   _id: 'parameter1',
   *   name: 'Parameter 1',
   *   required: false,
   *   groupingId: 'parameter',
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
   *   parameter1: 1,
   * }
   *
   * // If the user selects 'Option 2', the value in the effect's arguments
   * // will look like this:
   * {
   *   parameter1: 2,
   * }
   * ```
   */
  value: Value
  /**
   * This will be used for a hover-over tooltip.
   * @note This can be used to provide additional information or clarification about the argument.
   * @default undefined
   */
  tooltipDescription?: string
}

/**
 * The option value types for a required dropdown parameter.
 */
export type TReqDropdownTargetParameterOptionVal =
  | string
  | number
  | boolean
  | object

/**
 * The option value types for an optional dropdown parameter.
 */
export type TOptDropdownTargetParameterOptionVal =
  | string
  | number
  | boolean
  | object
  | null
  | undefined

/**
 * The option value types for a dropdown parameter.
 */
export type TDropdownTargetParameterOptionVal =
  | TReqDropdownTargetParameterOptionVal
  | TOptDropdownTargetParameterOptionVal
