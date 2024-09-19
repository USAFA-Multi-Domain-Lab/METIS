import { TAction, TCommonMissionAction, TCommonMissionActionJson } from '.'
import { TCommonMissionTypes } from '..'
import { TCommonMissionNode, TCommonMissionNodeJson, TNode } from '../nodes'

/* -- TYPES -- */

/**
 * The execution of an action.
 */
export default interface IActionExecution<
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
 * Cheats that can be applied when executing an action.
 * @note Only relevant to members authorized to perform
 * cheats.
 */
export type TExecutionCheats = {
  /**
   * The action costs zero resources to execute.
   */
  zeroCost: boolean
  /**
   * The action executes instantly.
   */
  instantaneous: boolean
  /**
   * The action is guaranteed to succeed.
   */
  guaranteedSuccess: boolean
}
