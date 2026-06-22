import type { TBaseTargetParameter, TBaseTargetParameterJson } from '../types'
import { TargetParameter } from './TargetParameter'

/**
 * The string parameter type for a target.
 */
export class StringTargetParameter {
  /**
   * Converts a regex pattern to JSON.
   * @param pattern The pattern to encode.
   * @returns The encoded pattern.
   */
  private static encodePattern = (pattern: RegExp): TRegexJson => ({
    source: pattern.source,
    flags: pattern.flags,
  })

  /**
   * Converts a regex pattern from JSON.
   * @param pattern The pattern to decode.
   * @returns The decoded pattern.
   */
  private static decodePattern = (pattern: TRegexJson): RegExp =>
    new RegExp(pattern.source, pattern.flags ?? '')

  /**
   * Converts TStringTargetParameter to TStringTargetParameterJson.
   * @param parameter The string parameter to convert.
   * @returns The string parameter as JSON.
   */
  public static toJson = (
    parameter: TStringTargetParameter,
  ): TStringTargetParameterJson => {
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
          pattern: parameter.pattern
            ? StringTargetParameter.encodePattern(parameter.pattern)
            : undefined,
          title: parameter.title,
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
          pattern: parameter.pattern
            ? StringTargetParameter.encodePattern(parameter.pattern)
            : undefined,
          title: parameter.title,
        }
  }

  /**
   * Converts TStringTargetParameterJson to TStringTargetParameter.
   * @param parameter The string parameter as JSON to convert.
   * @returns The string parameter.
   */
  public static fromJson = (
    parameter: TStringTargetParameterJson,
  ): TStringTargetParameter => {
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
          pattern: parameter.pattern
            ? StringTargetParameter.decodePattern(parameter.pattern)
            : undefined,
          title: parameter.title,
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
          pattern: parameter.pattern
            ? StringTargetParameter.decodePattern(parameter.pattern)
            : undefined,
          title: parameter.title,
        }
  }
}

/* -- TYPES -- */

/**
 * The string parameter type for a target.
 */
export type TStringTargetParameter = TBaseTargetParameter &
  (TStringTargetParameterOptional | TStringTargetParameterRequired) & {
    /**
     * The parameter's input type.
     * @note This will render as an input that accepts any string.
     * If the parameter is required, empty strings are not allowed.
     */
    type: 'string'
    /**
     * The regular expression pattern that the input value must match.
     */
    pattern?: RegExp
    /**
     * Used to display an error message when the input value doesn't match the pattern upon form submission.
     */
    title?: string
  }
/**
 * The optional string parameter type for a target.
 */
type TStringTargetParameterOptional = {
  /**
   * Determines whether the parameter is required or not.
   */
  required: false
}
/**
 * The required string parameter type for a target.
 */
type TStringTargetParameterRequired = {
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
 * The string parameter type for a target.
 */
export type TStringTargetParameterJson = TBaseTargetParameterJson &
  (TStringTargetParameterOptionalJson | TStringTargetParameterRequiredJson) & {
    /**
     * The parameter's input type.
     * @note This will render as an input that accepts any string.
     * If the parameter is required, empty strings are not allowed.
     */
    type: 'string'
    /**
     * The regular expression pattern that the input value must match.
     */
    pattern?: TRegexJson
    /**
     * Used to display an error message when the input value doesn't match the pattern upon form submission.
     */
    title?: string
  }

/**
 * A JSON-safe representation of a regular expression.
 */
export type TRegexJson = {
  /**
   * The regex source.
   */
  source: string
  /**
   * The regex flags.
   */
  flags?: string
}
/**
 * The optional string parameter type for a target.
 */
type TStringTargetParameterOptionalJson = {
  /**
   * Determines whether the parameter is required or not.
   */
  required: false
}
/**
 * The required string parameter type for a target.
 */
type TStringTargetParameterRequiredJson = {
  /**
   * Determines whether the parameter is required or not.
   */
  required: true
  /**
   * The default value for the parameter.
   */
  default: string
}
