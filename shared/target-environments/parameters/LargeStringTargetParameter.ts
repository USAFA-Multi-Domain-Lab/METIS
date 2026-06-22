import type { TBaseTargetParameter, TBaseTargetParameterJson } from '../types'
import { TargetParameter } from './TargetParameter'

/**
 * The large character string parameter type for a target.
 */
export class LargeStringTargetParameter {
  /**
   * Converts TLargeStringTargetParameter to TLargeStringTargetParameterJson.
   * @param parameter The large string parameter to convert.
   * @returns The large string parameter as JSON.
   */
  public static toJson = (
    parameter: TLargeStringTargetParameter,
  ): TLargeStringTargetParameterJson => {
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
        }
  }

  /**
   * Converts TLargeStringTargetParameterJson to TLargeStringTargetParameter.
   * @param parameter The large string parameter as JSON to convert.
   * @returns The large string parameter.
   */
  public static fromJson = (
    parameter: TLargeStringTargetParameterJson,
  ): TLargeStringTargetParameter => {
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
        }
  }
}

/* -- TYPES -- */

/**
 * The large character string parameter type for a target.
 */
export type TLargeStringTargetParameter = TBaseTargetParameter &
  (
    | TLargeStringTargetParameterOptional
    | TLargeStringTargetParameterRequired
  ) & {
    /**
     * The parameter's input type.
     * @note This will render as an input that accepts any string.
     * If the parameter is required, empty strings are not allowed.
     */
    type: 'large-string'
  }
/**
 * The optional large character string parameter type for a target.
 */
type TLargeStringTargetParameterOptional = {
  /**
   * Determines whether the parameter is required or not.
   */
  required: false
}
/**
 * The required large character string parameter type for a target.
 */
type TLargeStringTargetParameterRequired = {
  /**
   * Determines whether the parameter is required or not.
   */
  required: true
  /**
   * The default value for the parameter.
   */
  default: string
}
/**
 * The large character string parameter type for a target.
 */
export type TLargeStringTargetParameterJson = TBaseTargetParameterJson &
  (
    | TLargeStringTargetParameterOptionalJson
    | TLargeStringTargetParameterRequiredJson
  ) & {
    /**
     * The parameter's input type.
     * @note This will render as an input that accepts any string.
     * If the parameter is required, empty strings are not allowed.
     */
    type: 'large-string'
  }
/**
 * The optional large character string parameter type for a target.
 */
type TLargeStringTargetParameterOptionalJson = {
  /**
   * Determines whether the parameter is required or not.
   */
  required: false
}
/**
 * The required large character string parameter type for a target.
 */
type TLargeStringTargetParameterRequiredJson = {
  /**
   * Determines whether the parameter is required or not.
   */
  required: true
  /**
   * The default value for the parameter.
   */
  default: string
}
