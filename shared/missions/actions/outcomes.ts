import { TCommonMissionAction } from '.'
import { TCommonMissionNode } from '../nodes'

/**
 * The JSON representation of an action outcome.
 */
export interface IActionOutcomeJSON {
  /**
   * The ID of the action executed.
   */
  actionID: string
  /**
   * The ID of the node upon which the action executed.
   */
  nodeID: string
  /**
   * Whether the action is successful in its execution.
   */
  successful: boolean
}

/**
 * The outcome of an action being executed.
 */
export default interface IActionOutcome {
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
  actionID: string
  /**
   * The ID of the node upon which the action executed.
   */
  nodeID: string
  /**
   * Whether the action is successful in its execution.
   */
  successful: boolean
  /**
   * Converts the action outcome to JSON.
   */
  toJson: () => IActionOutcomeJSON
}
