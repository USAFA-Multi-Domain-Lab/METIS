import Args, { TBaseArg, TBaseArgJson } from '.'

/**
 * The boolean argument type for a target.
 */
export default class BooleanArg {
  /**
   * Converts TBooleanArg to TBooleanArgJson.
   * @param arg The boolean argument to convert.
   * @returns The boolean argument as JSON.
   */
  public static toJson = (arg: TBooleanArg): TBooleanArgJson => {
    // Return the appropriate properties based on
    // whether the argument is required or not.
    return arg.required
      ? {
          _id: arg._id,
          name: arg.name,
          groupingId: arg.groupingId,
          dependencies: arg.dependencies
            ? Args.encodeDependencies(arg.dependencies)
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
            ? Args.encodeDependencies(arg.dependencies)
            : undefined,
          tooltipDescription: arg.tooltipDescription,
          type: arg.type,
          required: arg.required,
        }
  }

  /**
   * Converts TBooleanArgJson to TBooleanArg.
   * @param arg The boolean argument as JSON to convert.
   * @returns The boolean argument.
   */
  public static fromJson = (arg: TBooleanArgJson): TBooleanArg => {
    // Return the appropriate properties based on
    // whether the argument is required or not.
    return arg.required
      ? {
          _id: arg._id,
          name: arg.name,
          groupingId: arg.groupingId,
          dependencies: arg.dependencies
            ? Args.decodeDependencies(arg.dependencies)
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
            ? Args.decodeDependencies(arg.dependencies)
            : undefined,
          tooltipDescription: arg.tooltipDescription,
          type: arg.type,
          required: arg.required,
        }
  }
}

/* ------------------------------ BOOLEAN ARGUMENT TYPES ------------------------------ */

/**
 * The boolean argument type for a target.
 */
export type TBooleanArg = TBaseArg &
  (TBooleanArgOptional | TBooleanArgRequired) & {
    /**
     * The argument's input type.
     * @note This will render as a toggle switch.
     */
    type: 'boolean'
  }
/**
 * The optional boolean argument type for a target.
 */
type TBooleanArgOptional = {
  /**
   * Determines whether the argument is required or not.
   */
  required: false
}
/**
 * The required boolean argument type for a target.
 */
type TBooleanArgRequired = {
  /**
   * Determines whether the argument is required or not.
   */
  required: true
  /**
   * The default value for the argument.
   */
  default: boolean
}
/**
 * The boolean argument type for a target.
 */
export type TBooleanArgJson = TBaseArgJson &
  (TBooleanArgOptionalJson | TBooleanArgRequiredJson) & {
    /**
     * The argument's input type.
     * @note This will render as a toggle switch.
     */
    type: 'boolean'
  }
/**
 * The optional boolean argument type for a target.
 */
type TBooleanArgOptionalJson = {
  /**
   * Determines whether the argument is required or not.
   */
  required: false
}
/**
 * The required boolean argument type for a target.
 */
type TBooleanArgRequiredJson = {
  /**
   * Determines whether the argument is required or not.
   */
  required: true
  /**
   * The default value for the argument.
   */
  default: boolean
}
