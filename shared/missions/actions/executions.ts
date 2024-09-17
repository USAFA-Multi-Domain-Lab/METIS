import { TAction, TCommonMissionAction, TCommonMissionActionJson } from '.'
import { TCommonMissionTypes } from '..'
import { TCommonMissionNode, TCommonMissionNodeJson, TNode } from '../nodes'

/**
 * Extracts the execution type from the mission types.
 * @param T The mission types.
 * @returns The execution type.
 */
export type TExecution<T extends TCommonMissionTypes> = T['execution']

/**
 * The JSON representation of an action execution.
 */
export type TActionExecutionJson = {
  /**
   * The ID of the action executed.
   */
  actionId: NonNullable<TCommonMissionActionJson['_id']>
  /**
   * The ID of the node upon which the action executed.
   */
  nodeId: NonNullable<TCommonMissionNodeJson['_id']>
  /**
   * The timestamp for when the action began executing.
   */
  start: number
  /**
   * The timestamp for when the action is expected to finish executing.
   */
  end: number
} | null

/**
 * The execution of an action.
 */
export default interface IActionExecution<
  T extends TCommonMissionTypes = TCommonMissionTypes,
> {
  /**
   * The time remaining for the action to complete.
   */
  get timeRemaining(): number
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
   * The timestamp for when the action began executing.
   */
  start: number
  /**
   * The timestamp for when the action is expected to finish executing.
   */
  end: number
  /**
   * Converts the action execution to JSON.
   */
  toJson: () => TActionExecutionJson
}
