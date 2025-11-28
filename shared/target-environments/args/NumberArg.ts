import type { TBaseArg, TBaseArgJson } from '../types'
import { Arg } from './Arg'

/**
 * The number argument type for a target.
 */
export class NumberArg {
  /**
   * Converts TNumberArg to TNumberArgJson.
   * @param arg The number argument to convert.
   * @returns The number argument as JSON.
   */
  public static toJson = (arg: TNumberArg): TNumberArgJson => {
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
            ? Arg.encodeDependencies(arg.dependencies)
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
  public static fromJson = (arg: TNumberArgJson): TNumberArg => {
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
            ? Arg.decodeDependencies(arg.dependencies)
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
    /**
     * Determines if only integers are allowed for the argument's value.
     */
    integersOnly?: boolean
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
    /**
     * Determines if only integers are allowed for the argument's value.
     */
    integersOnly?: boolean
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
