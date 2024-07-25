import Arg, { TBaseArg, TBaseArgJson } from '.'

/**
 * The force argument type for a target.
 */
export default class ForceArg {
  /**
   * Converts TForceArg to TForceArgJson.
   * @param arg The force argument to convert.
   * @returns The force argument as JSON.
   */
  public static toJson = (arg: TForceArg): TForceArgJson => {
    return {
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
   * Converts TForceArgJson to TForceArg.
   * @param arg The force argument as JSON to convert.
   * @returns The force argument.
   */
  public static fromJson = (arg: TForceArgJson): TForceArg => {
    return {
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

  /**
   * The ID of the force argument.
   */
  public static readonly ID: TForceArg['_id'] = 'forceId'

  /**
   * The name of the force argument.
   */
  public static readonly NAME: TForceArg['name'] = 'Force'
}

/* ------------------------------ FORCE ARGUMENT TYPES ------------------------------ */

/**
 * The force argument type for a target.
 */
export type TForceArg = TBaseArg & {
  /**
   * The argument's input type.
   * @note This will render a dropdown with a current
   * list of forces for the user to select from.
   */
  type: 'force'
  /**
   * The ID of the argument.
   */
  _id: 'forceId'
  /**
   * The argument's name. This is displayed to the user.
   */
  name: 'Force'
  /**
   * Determines whether the argument is required or not.
   */
  required: boolean
}

/**
 * The force argument type for a target.
 */
export type TForceArgJson = TBaseArgJson & {
  /**
   * The argument's input type.
   * @note This will render as a dropdown box with
   * predefined options for the user to select from.
   */
  type: 'force'
  /**
   * The ID of the argument.
   */
  _id: 'forceId'
  /**
   * The argument's name. This is displayed to the user.
   */
  name: 'Force'
  /**
   * Determines whether the argument is required or not.
   */
  required: boolean
}
