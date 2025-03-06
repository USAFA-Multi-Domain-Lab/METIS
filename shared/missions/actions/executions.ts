import { TAction, TMissionActionJson } from '.'
import { TCommonMissionTypes } from '..'
import MissionNode, { TMissionNodeJson, TNode } from '../nodes'

/* -- CLASSES -- */

/**
 * The execution of an action.
 */
export default abstract class ActionExecution<
  T extends TCommonMissionTypes = TCommonMissionTypes,
> {
  /**
   * The action executed.
   */
  public readonly action: TAction<T>

  /**
   * The node upon which the action executed.
   */
  public get node(): TNode<T> {
    return this.action.node
  }

  /**
   * The ID of the action executed.
   */
  public get actionId(): TAction<T>['_id'] {
    return this.action._id
  }

  /**
   * The ID of the node upon which the action executed
   */
  public get nodeId(): TNode<T>['_id'] {
    return this.action.node._id
  }

  /**
   * The timestamp for when the action began executing.
   */
  public readonly start: number

  /**
   * The timestamp for when the action is expected to
   * finish executing
   */
  public readonly end: number

  /**
   * Whether the action execution has been aborted
   * before completion.
   */
  protected _aborted: boolean

  /**
   * Whether the action execution has been aborted
   * before completion.
   */
  public get aborted(): boolean {
    return this._aborted
  }

  /**
   * The state of the action execution (e.g. executing,
   * success, failure).
   */
  public get state(): TActionExecutionState {
    if (this.timeRemaining) {
      return 'executing'
    } else {
      // todo: Add logic to determine success or failure.
      return 'success'
    }
  }

  /**
   * The time remaining for the action to complete
   * (in milliseconds).
   */
  public get timeRemaining(): number {
    let executionTimeEnd: number = this.end
    let now: number = Date.now()

    if (executionTimeEnd < now) {
      return 0
    } else {
      return executionTimeEnd - now
    }
  }

  /**
   * The number of seconds remaining for the action
   * to complete.
   */
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

  /**
   * The total amount of time the action is expected
   * to take to execute (in milliseconds).
   */
  public get duration(): number {
    return this.end - this.start
  }

  /**
   * The percentage value of completion for the given
   * execution based on the start and end times.
   */
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

  /**
   * @param action The action to execute.
   * @param start The timestamp for when the action began executing.
   * @param end The timestamp for when the action is expected to
   * finish
   * @param aborted Whether the action execution has been aborted
   * before completion.
   */
  public constructor(
    action: TAction<T>,
    start: number,
    end: number,
    aborted: boolean = false,
  ) {
    this.action = action
    this.start = start
    this.end = end
    this._aborted = aborted
  }

  /**
   * Converts the action execution to JSON.
   * @returns The JSON representation of the action execution.
   */
  public toJson(): TActionExecutionJson {
    return {
      actionId: this.actionId,
      nodeId: this.nodeId,
      start: this.start,
      end: this.end,
      aborted: this.aborted,
    }
  }

  /**
   * Aborts the execution of the action.
   * @returns Whether the action execution was successfully aborted.
   */
  public abort(): boolean {
    if (!this.aborted && this.state === 'executing') {
      this._aborted = true
      return true
    } else {
      return false
    }
  }
}

/* -- TYPES -- */

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
  actionId: NonNullable<TMissionActionJson['_id']>
  /**
   * The ID of the node upon which the action executed.
   */
  nodeId: NonNullable<TMissionNodeJson['_id']>
  /**
   * The timestamp for when the action began executing.
   */
  start: number
  /**
   * The timestamp for when the action is expected to finish executing.
   */
  end: number
  /**
   * Whether the action execution has been aborted
   * before completion.
   * @default false
   */
  aborted?: boolean
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
