import type {
  TBaseTargetParameter,
  TBaseTargetParameterJson,
} from '../../types'
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
 * A serialized selection of a mission component, which can
 * be saved with effect args to the database.
 */
export type TMissionComponentSerializedSelection = {
  /**
   * The type of mission component selected (e.g. "force",
   * "node", "action").
   */
  componentType: TMissionComponentType
  /**
   * The last known name of the component that was selected.
   * This is useful when, for whatever reason, the selection
   * is present in the args, but the actual component cannot
   * be found in the mission.
   */
  lastKnownName: string
  /**
   * A string of identifiers used to find the component
   * quickly in the mission. The identifiers define a
   * path to the component in the mission outline. For example,
   * [forceId, nodeId, actionId] would be the path to an action.
   * @note The IDs of the ancestor components are included
   * for quicker lookup.
   */
  ids: string[]
}

/**
 * Available options when defining
 * {@link TMissionComponentArg2.validComponentTypes}.
 */
export type TMissionComponentType =
  | keyof Pick<
      TMetisBaseComponents,
      | 'mission'
      | 'force'
      | 'node'
      | 'action'
      | 'missionFile'
      | 'resource'
      | 'resourcePool'
    >
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
