import Arg, { TBaseArg, TBaseArgJson } from '.'

/**
 * The node argument type for a target.
 */
export default class NodeArg {
  /**
   * Converts TNodeArg to TNodeArgJson.
   * @param arg The node argument to convert.
   * @returns The node argument as JSON.
   */
  public static toJson = (arg: TNodeArg): TNodeArgJson => {
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
   * Converts TNodeArgJson to TNodeArg.
   * @param arg The node argument as JSON to convert.
   * @returns The node argument.
   */
  public static fromJson = (arg: TNodeArgJson): TNodeArg => {
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
   * The key used in the effect's arguments to reference the node's ID.
   */
  public static readonly NODE_ID_KEY: TNodeArg['_id'] = 'nodeId'

  /**
   * The key used in the effect's arguments to reference the node's name.
   */
  public static readonly NODE_NAME_KEY = 'nodeName'
}

/* ------------------------------ NODE ARGUMENT TYPES ------------------------------ */

/**
 * The node argument type for a target.
 */
export type TNodeArg = TBaseArg & {
  /**
   * The argument's input type.
   * @note This will render two dropdowns:
   * 1. A dropdown for forces
   * 2. A dropdown for nodes (***populated based on the force selected***)
   */
  type: 'node'
  /**
   * The ID of the argument.
   */
  _id: string
  /**
   * The argument's name. This is displayed to the user.
   */
  name: string
  /**
   * Determines whether the argument is required or not.
   */
  required: boolean
}

/**
 * The node argument type for a target.
 */
export type TNodeArgJson = TBaseArgJson & {
  /**
   * The argument's input type.
   * @note This will render two dropdowns:
   * 1. A dropdown for forces
   * 2. A dropdown for nodes (***populated based on the force selected***)
   */
  type: 'node'
  /**
   * The ID of the argument.
   */
  _id: string
  /**
   * The argument's name. This is displayed to the user.
   */
  name: string
  /**
   * Determines whether the argument is required or not.
   */
  required: boolean
}
