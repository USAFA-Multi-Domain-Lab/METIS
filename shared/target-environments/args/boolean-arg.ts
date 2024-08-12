import Arg, { TBaseArg, TBaseArgJson } from '.'

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
    return {
      _id: arg._id,
      name: arg.name,
      groupingId: arg.groupingId,
      dependencies: arg.dependencies
        ? Arg.encodeDependencies(arg.dependencies)
        : undefined,
      tooltipDescription: arg.tooltipDescription,
      type: arg.type,
      default: arg.default,
    }
  }

  /**
   * Converts TBooleanArgJson to TBooleanArg.
   * @param arg The boolean argument as JSON to convert.
   * @returns The boolean argument.
   */
  public static fromJson = (arg: TBooleanArgJson): TBooleanArg => {
    return {
      _id: arg._id,
      name: arg.name,
      groupingId: arg.groupingId,
      dependencies: arg.dependencies
        ? Arg.decodeDependencies(arg.dependencies)
        : undefined,
      tooltipDescription: arg.tooltipDescription,
      type: arg.type,
      default: arg.default,
    }
  }
}

/* ------------------------------ BOOLEAN ARGUMENT TYPES ------------------------------ */

/**
 * The boolean argument type for a target.
 */
export type TBooleanArg = TBaseArg & {
  /**
   * The argument's input type.
   * @note This will render as a toggle switch.
   */
  type: 'boolean'
  /**
   * The default value for the argument.
   * @note If not provided, the default value will be `false`.
   */
  default?: true
}
/**
 * The boolean argument type for a target.
 */
export type TBooleanArgJson = TBaseArgJson & {
  /**
   * The argument's input type.
   * @note This will render as a toggle switch.
   */
  type: 'boolean'
  /**
   * The default value for the argument.
   * @note If not provided, the default value will be `false`.
   */
  default?: true
}
