import type { TBaseTargetParameter, TBaseTargetParameterJson } from '../types'
import { TargetParameter } from './TargetParameter'

/**
 * The number parameter type for a target.
 */
export class NumberTargetParameter {
  /**
   * Converts TNumberArg to TNumberArgJson.
   * @param arg The number argument to convert.
   * @returns The number argument as JSON.
   */
  public static toJson = (
    arg: TNumberTargetParameter,
  ): TNumberTargetParameterJson => {
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
          default: arg.default,
          min: arg.min,
          max: arg.max,
          unit: arg.unit,
          integersOnly: arg.integersOnly,
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
          min: arg.min,
          max: arg.max,
          unit: arg.unit,
          integersOnly: arg.integersOnly,
        }
  }

  /**
   * Converts TNumberArgJson to TNumberArg.
   * @param arg The number argument as JSON to convert.
   * @returns The number argument.
   */
  public static fromJson = (
    arg: TNumberTargetParameterJson,
  ): TNumberTargetParameter => {
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
          default: arg.default,
          min: arg.min,
          max: arg.max,
          unit: arg.unit,
          integersOnly: arg.integersOnly,
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
          min: arg.min,
          max: arg.max,
          unit: arg.unit,
          integersOnly: arg.integersOnly,
        }
  }
}

/* -- TYPES -- */

/**
 * The number parameter type for a target.
 */
export type TNumberTargetParameter = TBaseTargetParameter &
  (TNumberTargetParameterOptional | TNumberTargetParameterRequired) & {
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
    /**
     * Determines if only integers are allowed for the argument's value.
     */
    integersOnly?: boolean
  }
/**
 * The optional number parameter type for a target.
 */
type TNumberTargetParameterOptional = {
  /**
   * Determines whether the parameter is required or not.
   */
  required: false
}
/**
 * The required number parameter type for a target.
 */
type TNumberTargetParameterRequired = {
  /**
   * Determines whether the parameter is required or not.
   */
  required: true
  /**
   * The default value for the parameter.
   */
  default: number
}
/**
 * The number parameter type for a target.
 */
export type TNumberTargetParameterJson = TBaseTargetParameterJson &
  (TNumberTargetParameterOptionalJson | TNumberTargetParameterRequiredJson) & {
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
    /**
     * Determines if only integers are allowed for the argument's value.
     */
    integersOnly?: boolean
  }
/**
 * The optional number parameter type for a target.
 */
type TNumberTargetParameterOptionalJson = {
  /**
   * Determines whether the parameter is required or not.
   */
  required: false
}
/**
 * The required number parameter type for a target.
 */
type TNumberTargetParameterRequiredJson = {
  /**
   * Determines whether the parameter is required or not.
   */
  required: true
  /**
   * The default value for the parameter.
   */
  default: number
}
