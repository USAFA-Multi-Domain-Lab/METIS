import type { TBaseArg, TBaseArgJson } from '../../types'
import { Arg } from '../Arg'

/**
 * Allows the selection of mission components (forces, nodes, actions, etc.)
 * as an argument for a target.
 */
export class MissionComponentArg2 {
  /**
   * Converts `TMissionComponentArg` to `TMissionComponentArgJson`.
   * @param arg The mission component argument to convert.
   * @returns The mission component argument as JSON.
   */
  public static toJson = (
    arg: TMissionComponentArg2,
  ): TMissionComponentArgJson2 => {
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
      multiSelect: arg.multiSelect,
      validComponentTypes: arg.validComponentTypes,
    }
  }

  /**
   * Converts `TMissionComponentArgJson` to `TMissionComponentArg`.
   * @param arg The mission component argument as JSON to convert.
   * @returns The mission component argument.
   */
  public static fromJson = (
    arg: TMissionComponentArgJson2,
  ): TMissionComponentArg2 => {
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
      multiSelect: arg.multiSelect,
      validComponentTypes: arg.validComponentTypes,
    }
  }
}

/* -- TYPES -- */

/**
 * The mission component argument type for a target.
 */
export type TMissionComponentArg2 = TBaseArg & {
  /**
   * The argument's input type.
   */
  type: 'mission-component'
  /**
   * Determines whether the argument is required or not.
   */
  required: boolean
  /**
   * Whether or not multiple mission components can be selected
   * for this argument, or just one.
   */
  multiSelect?: boolean
  /**
   * Mission component types that are valid for this argument.
   * For example, perhaps only "nodes" and "actions" are wanted,
   * so this would be set to `['node', 'action']`.
   * @default ['any']
   */
  validComponentTypes?: TMissionComponentType[]
}

/**
 * Available options when defining
 * {@link TMissionComponentArg2.validComponentTypes}.
 */
export type TMissionComponentType =
  | 'mission'
  | 'force'
  | 'node'
  | 'action'
  | 'any'

/**
 * The mission component argument type for a target.
 */
export type TMissionComponentArgJson2 = TBaseArgJson & {
  /**
   * @see {@link TMissionComponentArg2.type}
   */
  type: 'mission-component'
  /**
   * @see {@link TMissionComponentArg2.required}
   */
  required: boolean
  /**
   * @see {@link TMissionComponentArg2.multiSelect}
   */
  multiSelect?: boolean
  /**
   * @see {@link TMissionComponentArg2.validComponentTypes}
   */
  validComponentTypes?: TMissionComponentType[]
}
