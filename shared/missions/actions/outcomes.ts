import { TAction, TMissionActionJson } from '.'
import { TCommonMissionTypes } from '..'
import { TMissionNodeJson, TNode } from '../nodes'

/**
 * Extracts the outcome type from the mission types.
 * @param T The mission types.
 * @returns The outcome type.
 */
export type TOutcome<T extends TCommonMissionTypes> = T['outcome']

/**
 * The JSON representation of an action outcome.
 */
export interface TActionOutcomeJson {
  /**
   * The ID of the action executed.
   */
  actionId: NonNullable<TMissionActionJson['_id']>
  /**
   * The ID of the node upon which the action executed.
   */
  nodeId: TMissionNodeJson['_id']
  /**
   * Whether the action was a success, failure,
   * or was aborted.
   */
  status: TOutcomeStatus
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
  actionId: TAction<T>['_id']
  /**
   * The ID of the node upon which the action executed.
   */
  nodeId: TNode<T>['_id']
  /**
   * Whether the action was a success, failure,
   * or was aborted.
   */
  status: TOutcomeStatus
  /**
   * Converts the action outcome to JSON.
   */
  toJson: () => TActionOutcomeJson
}

/**
 * The status of an action outcome.
 * @option 'success' The action was successful.
 * @option 'failure' The action was a failure.
 * @option 'aborted' The action was aborted before completion.
 */
export type TOutcomeStatus = 'success' | 'failure' | 'aborted'
