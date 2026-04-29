import type { TBaseTargetParameter, TBaseTargetParameterJson } from '../../types'
import { TargetParameter } from '../TargetParameter'

/**
 * Allows the selection of mission components (forces, nodes, actions, etc.)
 * as a parameter for a target.
 */
export class MissionComponentTargetParameter2 {
  /**
   * Converts `TMissionComponentArg` to `TMissionComponentArgJson`.
   * @param arg The mission component argument to convert.
   * @returns The mission component argument as JSON.
   */
  public static toJson = (
    arg: TMissionComponentTargetParameter2,
  ): TMissionComponentTargetParameterJson2 => {
    return {
      _id: arg._id,
      name: arg.name,
      groupingId: arg.groupingId,
      dependencies: arg.dependencies
        ? TargetParameter.encodeDependencies(arg.dependencies)
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
    arg: TMissionComponentTargetParameterJson2,
  ): TMissionComponentTargetParameter2 => {
    return {
      _id: arg._id,
      name: arg.name,
      groupingId: arg.groupingId,
      dependencies: arg.dependencies
        ? TargetParameter.decodeDependencies(arg.dependencies)
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
 * The mission component parameter type for a target.
 */
export type TMissionComponentTargetParameter2 = TBaseTargetParameter & {
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
 * The mission component parameter type for a target.
 */
export type TMissionComponentTargetParameterJson2 = TBaseTargetParameterJson & {
  /**
   * @see {@link TMissionComponentTargetParameter2.type}
   */
  type: 'mission-component'
  /**
   * @see {@link TMissionComponentTargetParameter2.required}
   */
  required: boolean
  /**
   * @see {@link TMissionComponentTargetParameter2.multiSelect}
   */
  multiSelect?: boolean
  /**
   * @see {@link TMissionComponentTargetParameter2.validComponentTypes}
   */
  validComponentTypes?: TMissionComponentType[]
}
