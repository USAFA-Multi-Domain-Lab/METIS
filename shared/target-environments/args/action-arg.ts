import Arg, { TBaseArg, TBaseArgJson } from '.'

/**
 * The action argument type for a target.
 */
export default class ActionArg {
  /**
   * Converts `TActionArg` to `TActionArgJson`.
   * @param arg The action argument to convert.
   * @returns The action argument as JSON.
   */
  public static toJson = (arg: TActionArg): TActionArgJson => {
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
   * Converts `TActionArgJson` to `TActionArg`.
   * @param arg The action argument as JSON to convert.
   * @returns The action argument.
   */
  public static fromJson = (arg: TActionArgJson): TActionArg => {
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
   * The key used in the effect's arguments to reference the action's ID.
   */
  public static readonly ACTION_ID_KEY: TActionArg['_id'] = 'actionId'

  /**
   * The key used in the effect's arguments to reference the action's name.
   */
  public static readonly ACTION_NAME_KEY = 'actionName'
}

/* ------------------------------ ACTION ARGUMENT TYPES ------------------------------ */

/**
 * The action argument type for a target.
 */
export type TActionArg = TBaseArg & {
  /**
   * The argument's input type.
   * @note This will render 3 dropdowns:
   * 1. A dropdown for forces
   * 2. A dropdown for nodes (***populated based on the force selected***)
   * 3. A dropdown for actions (***populated based on the node selected***)
   */
  type: 'action'
  /**
   * The ID of the argument.
   */
  _id: string
  /**
   * The argument's name.
   * @note This is displayed to the user.
   */
  name: string
  /**
   * Determines whether the argument is required or not.
   */
  required: boolean
}

/**
 * The action argument type for a target.
 */
export type TActionArgJson = TBaseArgJson & {
  /**
   * The argument's input type.
   * @note This will render 3 dropdowns:
   * 1. A dropdown for forces
   * 2. A dropdown for nodes (***populated based on the force selected***)
   * 3. A dropdown for actions (***populated based on the node selected***)
   */
  type: 'action'
  /**
   * The ID of the argument.
   */
  _id: string
  /**
   * The argument's name.
   * @note This is displayed to the user.
   */
  name: string
  /**
   * Determines whether the argument is required or not.
   */
  required: boolean
}
