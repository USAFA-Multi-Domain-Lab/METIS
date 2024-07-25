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
   * @note The key stored in the `context.effect.args` for the force argument is `forceId` and the value will be the selected force ID.
   * @note The key stored in the `context.effect.args` for the node argument is `nodeId` and the value will be the selected node ID.
   */
  type: 'node'
  /**
   * The ID of the argument.
   * @note This is used to store the selected node ID in the `context.effect.args`.
   */
  _id: 'nodeId'
  /**
   * The argument's name. This is displayed to the user.
   */
  name: 'Node'
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
   * @note The key stored in the `context.effect.args` for the force argument is `forceId` and the value will be the selected force ID.
   * @note The key stored in the `context.effect.args` for the node argument is `nodeId` and the value will be the selected node ID.
   */
  type: 'node'
  /**
   * The ID of the argument.
   */
  _id: 'nodeId'
  /**
   * The argument's name. This is displayed to the user.
   */
  name: 'Node'
  /**
   * Determines whether the argument is required or not.
   */
  required: boolean
}
