import type { TBaseArg, TBaseArgJson } from '../../types'
import { Arg } from '../Arg'

/**
 * The mission component argument type for a target.
 */
export class MissionComponentArg {
  /**
   * Converts `TMissionComponentArg` to `TMissionComponentArgJson`.
   * @param arg The mission component argument to convert.
   * @returns The mission component argument as JSON.
   */
  public static toJson = (
    arg: TMissionComponentArg,
  ): TMissionComponentArgJson => {
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
   * Converts `TMissionComponentArgJson` to `TMissionComponentArg`.
   * @param arg The mission component argument as JSON to convert.
   * @returns The mission component argument.
   */
  public static fromJson = (
    arg: TMissionComponentArgJson,
  ): TMissionComponentArg => {
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

/* -- TYPES -- */

/**
 * The mission component argument type for a target.
 */
export type TMissionComponentArg = TBaseArg & {
  /**
   * The argument's input type.
   * @note This will render up to 3 dropdowns depending on the type.
   * @options
   * - type === `force`:
   *    1. A dropdown box populated with the current list of forces.
   * - type === `node`:
   *    1. A dropdown box populated with the current list of forces.
   *    2. A dropdown box populated with the current list of nodes (***populated based on the force selected***).
   * - type === `action`:
   *    1. A dropdown box populated with the current list of forces.
   *    2. A dropdown box populated with the current list of nodes (***populated based on the force selected***).
   *    3. A dropdown box populated with the current list of actions (***populated based on the node selected***).
   * - type === `file`:
   *    1. A dropdown box populated with the current list of files.
   */
  type: 'force' | 'node' | 'action' | 'file'
  /**
   * Determines whether the argument is required or not.
   */
  required: boolean
}

/**
 * The mission component argument type for a target.
 */
export type TMissionComponentArgJson = TBaseArgJson & {
  /**
   * @see {@link TMissionComponentArg.type}
   */
  type: TMissionComponentArg['type']
  /**
   * @see {@link TMissionComponentArg.required}
   */
  required: boolean
}
