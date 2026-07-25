import type { TSatisfies } from '@shared/toolbox/objects/ObjectToolbox'
import type {
  TBaseTargetParameter,
  TBaseTargetParameterJson,
} from '../../types'
import { TargetParameter } from '../TargetParameter'

/**
 * Allows the selection of mission components (forces, nodes, actions, etc.)
 * as a parameter for a target.
 */
export class MissionComponentTargetParameter {
  /**
   * Every component type that can appear in a saved selection. Kept as a
   * single list so that runtime validation of stored selections and
   * {@link TSelectedMissionComponentType} cannot drift apart.
   */
  public static readonly SELECTED_COMPONENT_TYPES = [
    'mission',
    'force',
    'node',
    'action',
    'missionFile',
    'resource',
    'resourcePool',
  ] as const satisfies readonly TSelectedMissionComponentType[]

  /**
   * Converts `TMissionComponentTargetParameter` to `TMissionComponentTargetParameterJson`.
   * @param parameter The mission component parameter to convert.
   * @returns The mission component parameter as JSON.
   */
  public static toJson = (
    parameter: TMissionComponentTargetParameter,
  ): TMissionComponentTargetParameterJson => {
    return {
      _id: parameter._id,
      name: parameter.name,
      groupingId: parameter.groupingId,
      dependencies: parameter.dependencies
        ? TargetParameter.encodeDependencies(parameter.dependencies)
        : undefined,
      tooltipDescription: parameter.tooltipDescription,
      type: parameter.type,
      validComponentTypes: parameter.validComponentTypes,
    }
  }

  /**
   * Converts `TMissionComponentTargetParameterJson` to `TMissionComponentTargetParameter`.
   * @param arg The mission component parameter as JSON to convert.
   * @returns The mission component parameter.
   */
  public static fromJson = (
    arg: TMissionComponentTargetParameterJson,
  ): TMissionComponentTargetParameter => {
    return {
      _id: arg._id,
      name: arg.name,
      groupingId: arg.groupingId,
      dependencies: arg.dependencies
        ? TargetParameter.decodeDependencies(arg.dependencies)
        : undefined,
      tooltipDescription: arg.tooltipDescription,
      type: arg.type,
      validComponentTypes: arg.validComponentTypes,
    }
  }
}

/* -- TYPES -- */

/**
 * The mission component parameter type for a target.
 */
export type TMissionComponentTargetParameter = TBaseTargetParameter & {
  /**
   * The parameter's input type.
   */
  type: 'mission-component'
  /**
   * Mission component types that are valid for this parameter.
   * For example, perhaps only "nodes" and "actions" are wanted,
   * so this would be set to `['node', 'action']`.
   * @default ['any']
   */
  validComponentTypes?: TMissionComponentType[]
}

/**
 * A serialized selection of a mission component, which can
 * be saved with effect arguments to the database.
 */
export type TMissionComponentSerializedSelection = {
  /**
   * The type of mission component selected (e.g. "force",
   * "node", "action").
   */
  componentType: TSelectedMissionComponentType
  /**
   * The last known name of the component that was selected.
   * This is useful when, for whatever reason, the selection
   * is present in the arguments, but the actual component cannot
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
 * {@link TMissionComponentTargetParameter.validComponentTypes}.
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
 * The type of a mission component that was actually selected. `"any"` is
 * authoring vocabulary for
 * {@link TMissionComponentTargetParameter.validComponentTypes}, where it
 * means every type is selectable, so it can never describe a component
 * someone picked.
 */
export type TSelectedMissionComponentType = Exclude<
  TMissionComponentType,
  'any'
>

/**
 * Fails to compile if a member of {@link TSelectedMissionComponentType} is
 * missing from {@link MissionComponentTargetParameter.SELECTED_COMPONENT_TYPES}.
 * The `satisfies` on that list only rules out entries that do not belong,
 * so this covers the opposite direction.
 * @note Appears unused, but this will produce a compile-time error if
 * not satisfied, which can be a helpful indicator of a problem.
 */
type TEverySelectedComponentTypeIsListed = TSatisfies<
  TSelectedMissionComponentType,
  (typeof MissionComponentTargetParameter.SELECTED_COMPONENT_TYPES)[number]
>

/**
 * The mission component parameter type for a target.
 */
export type TMissionComponentTargetParameterJson = TBaseTargetParameterJson & {
  /**
   * @see {@link TMissionComponentTargetParameter.type}
   */
  type: 'mission-component'
  /**
   * @see {@link TMissionComponentTargetParameter.validComponentTypes}
   */
  validComponentTypes?: TMissionComponentType[]
}
