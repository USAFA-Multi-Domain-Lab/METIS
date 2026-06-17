import type { TBaseTargetParameter, TBaseTargetParameterJson } from '../types'
import { TargetParameter } from './TargetParameter'

/**
 * The number parameter type for a target.
 */
export class NumberTargetParameter {
  /**
   * Converts TNumberTargetParameter to TNumberTargetParameterJson.
   * @param parameter The number parameter to convert.
   * @returns The number parameter as JSON.
   */
  public static toJson = (
    parameter: TNumberTargetParameter,
  ): TNumberTargetParameterJson => {
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
          min: parameter.min,
          max: parameter.max,
          unit: parameter.unit,
          integersOnly: parameter.integersOnly,
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
          min: parameter.min,
          max: parameter.max,
          unit: parameter.unit,
          integersOnly: parameter.integersOnly,
        }
  }

  /**
   * Converts TNumberTargetParameterJson to TNumberTargetParameter.
   * @param parameter The number parameter as JSON to convert.
   * @returns The number parameter.
   */
  public static fromJson = (
    parameter: TNumberTargetParameterJson,
  ): TNumberTargetParameter => {
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
          min: parameter.min,
          max: parameter.max,
          unit: parameter.unit,
          integersOnly: parameter.integersOnly,
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
          min: parameter.min,
          max: parameter.max,
          unit: parameter.unit,
          integersOnly: parameter.integersOnly,
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
     * The parameter's input type.
     * @note This will render as an input that only accepts numbers.
     */
    type: 'number'
    /**
     * The minimum allowed value for the parameter.
     */
    min?: number
    /**
     * The maximum allowed value for the parameter.
     */
    max?: number
    /**
     * The unit of measurement for the parameter.
     */
    unit?: string
    /**
     * Determines if only integers are allowed for the parameter's value.
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
     * The parameter's input type.
     * @note This will render as an input that only accepts numbers.
     */
    type: 'number'
    /**
     * The minimum allowed value for the parameter.
     */
    min?: number
    /**
     * The maximum allowed value for the parameter.
     */
    max?: number
    /**
     * The unit of measurement for the parameter.
     */
    unit?: string
    /**
     * Determines if only integers are allowed for the parameter's value.
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
