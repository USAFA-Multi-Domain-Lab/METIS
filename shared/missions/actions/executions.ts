import { TCommonMissionAction } from '.'
import { TCommonMissionNode } from '../nodes'

/**
 * The JSON representation of an action execution.
 */
export type TActionExecutionJSON = {
  /**
   * The ID of the action executed.
   */
  actionId: string
  /**
   * The ID of the node upon which the action executed.
   */
  nodeId: string
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
export default interface IActionExecution {
  /**
   * The action executed.
   */
  action: TCommonMissionAction
  /**
   * The node upon which the action executed.
   */
  node: TCommonMissionNode
  /**
   * The ID of the action executed.
   */
  actionId: string
  /**
   * The ID of the node upon which the action executed.
   */
  nodeId: string
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
  toJson: () => TActionExecutionJSON
}
