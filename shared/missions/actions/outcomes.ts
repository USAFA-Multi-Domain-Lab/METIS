import { TAction, TCommonMissionAction, TCommonMissionActionJson } from '.'
import { TCommonMissionTypes } from '..'
import { TCommonMissionNode, TCommonMissionNodeJson, TNode } from '../nodes'

/**
 * The JSON representation of an action outcome.
 */
export interface TActionOutcomeJson {
  /**
   * The ID of the action executed.
   */
  actionId: NonNullable<TCommonMissionActionJson['_id']>
  /**
   * The ID of the node upon which the action executed.
   */
  nodeId: TCommonMissionNodeJson['_id']
  /**
   * Whether the action is successful in its execution.
   */
  successful: boolean
}

/**
 * The outcome of an action being executed.
 */
export default interface IActionOutcome<
  T extends TCommonMissionTypes = TCommonMissionTypes,
> {
  /**
   * The action executed.
   */
  action: TAction<T>
  /**
   * The node upon which the action executed.
   */
  node: TNode<T>
  /**
   * The ID of the action executed.
   */
  actionId: TCommonMissionAction['_id']
  /**
   * The ID of the node upon which the action executed.
   */
  nodeId: TCommonMissionNode['_id']
  /**
   * Whether the action is successful in its execution.
   */
  successful: boolean
  /**
   * Converts the action outcome to JSON.
   */
  toJson: () => TActionOutcomeJson
}
