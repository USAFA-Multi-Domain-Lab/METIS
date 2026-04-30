import type { TBaseTargetParameter, TBaseTargetParameterJson } from '../types'
import { TargetParameter } from './TargetParameter'

/**
 * The large character string parameter type for a target.
 */
export class LargeStringTargetParameter {
  /**
   * Converts TLargeStringArg to TLargeStringArgJson.
   * @param arg The large string argument to convert.
   * @returns The large string argument as JSON.
   */
  public static toJson = (
    arg: TLargeStringTargetParameter,
  ): TLargeStringTargetParameterJson => {
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
        }
  }

  /**
   * Converts TLargeStringArgJson to TLargeStringArg.
   * @param arg The large string argument as JSON to convert.
   * @returns The large string argument.
   */
  public static fromJson = (
    arg: TLargeStringTargetParameterJson,
  ): TLargeStringTargetParameter => {
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
     * The argument's input type.
     * @note This will render as an input that accepts any string.
     * If the argument is required, empty strings are not allowed.
     */
    type: 'large-string'
  }
/**
 * The optional large character string parameter type for a target.
 */
type TLargeStringTargetParameterOptional = {
  /**
   * Determines whether the argument is required or not.
   */
  required: false
}
/**
 * The required large character string parameter type for a target.
 */
type TLargeStringTargetParameterRequired = {
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
 * The large character string parameter type for a target.
 */
export type TLargeStringTargetParameterJson = TBaseTargetParameterJson &
  (
    | TLargeStringTargetParameterOptionalJson
    | TLargeStringTargetParameterRequiredJson
  ) & {
    /**
     * The argument's input type.
     * @note This will render as an input that accepts any string.
     * If the argument is required, empty strings are not allowed.
     */
    type: 'large-string'
  }
/**
 * The optional large character string parameter type for a target.
 */
type TLargeStringTargetParameterOptionalJson = {
  /**
   * Determines whether the argument is required or not.
   */
  required: false
}
/**
 * The required large character string parameter type for a target.
 */
type TLargeStringTargetParameterRequiredJson = {
  /**
   * Determines whether the argument is required or not.
   */
  required: true
  /**
   * The default value for the argument.
   */
  default: string
}
