import Arg, { TBaseArg, TBaseArgJson } from '.'

/**
 * The large character string argument type for a target.
 */
export default class LargeStringArg {
  /**
   * Converts TLargeStringArg to TLargeStringArgJson.
   * @param arg The large string argument to convert.
   * @returns The large string argument as JSON.
   */
  public static toJson = (arg: TLargeStringArg): TLargeStringArgJson => {
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
   * Converts TLargeStringArgJson to TLargeStringArg.
   * @param arg The large string argument as JSON to convert.
   * @returns The large string argument.
   */
  public static fromJson = (arg: TLargeStringArgJson): TLargeStringArg => {
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

/* ------------------------------ LARGE STRING ARGUMENT TYPES ------------------------------ */

/**
 * The large character string argument type for a target.
 */
export type TLargeStringArg = TBaseArg &
  (TLargeStringArgOptional | TLargeStringArgRequired) & {
    /**
     * The argument's input type.
     * @note This will render as an input that accepts any string.
     * If the argument is required, empty strings are not allowed.
     */
    type: 'large-string'
  }
/**
 * The optional large character string argument type for a target.
 */
type TLargeStringArgOptional = {
  /**
   * Determines whether the argument is required or not.
   */
  required: false
}
/**
 * The required large character string argument type for a target.
 */
type TLargeStringArgRequired = {
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
 * The large character string argument type for a target.
 */
export type TLargeStringArgJson = TBaseArgJson &
  (TLargeStringArgOptionalJson | TLargeStringArgRequiredJson) & {
    /**
     * The argument's input type.
     * @note This will render as an input that accepts any string.
     * If the argument is required, empty strings are not allowed.
     */
    type: 'large-string'
  }
/**
 * The optional large character string argument type for a target.
 */
type TLargeStringArgOptionalJson = {
  /**
   * Determines whether the argument is required or not.
   */
  required: false
}
/**
 * The required large character string argument type for a target.
 */
type TLargeStringArgRequiredJson = {
  /**
   * Determines whether the argument is required or not.
   */
  required: true
  /**
   * The default value for the argument.
   */
  default: string
}
