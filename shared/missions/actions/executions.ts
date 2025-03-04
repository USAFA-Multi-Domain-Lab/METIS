import { TAction, TCommonMissionAction, TCommonMissionActionJson } from '.'
import { TCommonMissionTypes } from '..'
import { TCommonMissionNode, TCommonMissionNodeJson, TNode } from '../nodes'

/* -- CLASSES -- */

/**
 * The execution of an action.
 */
export default abstract class ActionExecution<
  T extends TCommonMissionTypes = TCommonMissionTypes,
> implements TCommonActionExecution<T>
{
  // Implemented
  public readonly action: TAction<T>

  // Implemented
  public get node(): TNode<T> {
    return this.action.node
  }

  // Implmented
  public get actionId(): TCommonMissionAction['_id'] {
    return this.action._id
  }

  // Implemented
  public get nodeId(): TCommonMissionNode['_id'] {
    return this.action.node._id
  }

  // Implemented
  public readonly start: number

  // Implemented
  public readonly end: number

  // Implemented
  public get state(): TActionExecutionState {
    if (this.timeRemaining) {
      return 'executing'
    } else {
      return 'success'
    }
  }

  // Implemented
  public get timeRemaining(): number {
    let executionTimeEnd: number = this.end
    let now: number = Date.now()

    if (executionTimeEnd < now) {
      return 0
    } else {
      return executionTimeEnd - now
    }
  }

  // Implemented
  public get secondsRemaining(): number {
    let executionTimeEnd: number = this.end
    let now: number = Date.now()
    let timeRemaining: number = executionTimeEnd - now

    if (executionTimeEnd < now) {
      return 0
    } else if (timeRemaining > 0 && timeRemaining < 1000) {
      return 1
    } else {
      return Math.floor(timeRemaining / 1000)
    }
  }

  // Implemented
  public get duration(): number {
    return this.end - this.start
  }

  // Implemented
  public get completionPercentage(): number {
    let duration: number = this.duration
    let end: number = this.end
    let now: number = Date.now()
    let percentRemaining: number = (end - now) / duration
    let percentCompleted: number = 1 - percentRemaining

    if (percentCompleted === Infinity) {
      percentCompleted = 0
    }

    return Math.min(percentCompleted, 1)
  }

  // Implemented
  public constructor(action: TAction<T>, start: number, end: number) {
    this.action = action
    this.start = start
    this.end = end
  }

  // Implemented
  public toJson(): TActionExecutionJson {
    return {
      actionId: this.actionId,
      nodeId: this.nodeId,
      start: this.start,
      end: this.end,
    }
  }
}

/* -- TYPES -- */

/**
 * The execution of an action.
 */
export type TCommonActionExecution<
  T extends TCommonMissionTypes = TCommonMissionTypes,
> = {
  /**
   * The action executed.
   */
  readonly action: TAction<T>
  /**
   * The node upon which the action executed.
   */
  get node(): TNode<T>
  /**
   * The ID of the action executed.
   */
  get actionId(): TCommonMissionAction['_id']
  /**
   * The ID of the node upon which the action executed.
   */
  get nodeId(): TCommonMissionNode['_id']
  /**
   * The timestamp for when the action began executing.
   */
  readonly start: number
  /**
   * The timestamp for when the action is expected to finish executing.
   */
  readonly end: number
  /**
   * The state of the action execution (e.g. executing,
   * success, failure).
   */
  get state(): TActionExecutionState
  /**
   * The time remaining for the action to complete (in milliseconds).
   */
  get timeRemaining(): number
  /**
   * The number of seconds remaining for the action to complete.
   */
  get secondsRemaining(): number
  /**
   * The total amount of time the action is expected
   * to take to execute.
   */
  get duration(): number
  /**
   * The percentage value of completion for the given execution
   * based on the start and end times.
   */
  get completionPercentage(): number
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

/**
 * Possible states for an action execution.
 */
export type TActionExecutionState = 'executing' | 'success' | 'failure'
