import Arg, { TBaseArg, TBaseArgJson } from '.'

/**
 * The string argument type for a target.
 */
export default class StringArg {
  /**
   * Converts TStringArg to TStringArgJson.
   * @param arg The string argument to convert.
   * @returns The string argument as JSON.
   */
  public static toJson = (arg: TStringArg): TStringArgJson => {
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
        }
  }

  /**
   * Converts TStringArgJson to TStringArg.
   * @param arg The string argument as JSON to convert.
   * @returns The string argument.
   */
  public static fromJson = (arg: TStringArgJson): TStringArg => {
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
        }
  }
}

/* ------------------------------ STRING ARGUMENT TYPES ------------------------------ */

/**
 * The string argument type for a target.
 */
export type TStringArg = TBaseArg &
  (TStringArgOptional | TStringArgRequired) & {
    /**
     * The argument's input type.
     * @note This will render as an input that accepts any string.
     * If the argument is required, empty strings are not allowed.
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
 * The optional string argument type for a target.
 */
type TStringArgOptional = {
  /**
   * Determines whether the argument is required or not.
   */
  required: false
  /**
   * The default value for the argument.
   */
  default?: string
}
/**
 * The required string argument type for a target.
 */
type TStringArgRequired = {
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
 * The string argument type for a target.
 */
export type TStringArgJson = TBaseArgJson &
  (TStringArgOptionalJson | TStringArgRequiredJson) & {
    /**
     * The argument's input type.
     * @note This will render as an input that accepts any string.
     * If the argument is required, empty strings are not allowed.
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
 * The optional string argument type for a target.
 */
type TStringArgOptionalJson = {
  /**
   * Determines whether the argument is required or not.
   */
  required: false
  /**
   * The default value for the argument.
   */
  default?: string
}
/**
 * The required string argument type for a target.
 */
type TStringArgRequiredJson = {
  /**
   * Determines whether the argument is required or not.
   */
  required: true
  /**
   * The default value for the argument.
   */
  default: string
}
