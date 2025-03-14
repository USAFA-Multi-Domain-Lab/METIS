import { TMetisComponent } from 'metis/index'
import { TAction } from '.'
import { TCommonMissionTypes, TCreateMissionJsonType } from '..'
import { TNode } from '../nodes'
import { TExecutionOutcomeJson, TOutcome, TOutcomeState } from './outcomes'

/* -- CLASSES -- */

/**
 * The execution of an action.
 */
export default abstract class ActionExecution<
  T extends TCommonMissionTypes = TCommonMissionTypes,
> implements TMetisComponent
{
  // Implemented
  public readonly _id: string

  // Implemented
  public get name(): string {
    return this._id.substring(0, 8)
  }

  /**
   * The action executed.
   */
  public readonly action: TAction<T>

  /**
   * Cache for `outcome` field.
   */
  protected _outcome: TOutcome<T> | null

  /**
   * The outcome of the action execution.
   */
  public get outcome(): TOutcome<T> | null {
    return this._outcome
  }

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
   * The state of the action execution (e.g. executing,
   * success, failure).
   */
  public get state(): TActionExecutionState {
    let { outcome } = this
    if (!outcome) return { status: 'executing' }
    else return outcome.state
  }

  /**
   * The status of the execution, determined
   * by the state.
   */
  public get status(): TActionExecutionState['status'] {
    return this.state.status
  }

  /**
   * The time remaining for the action to complete
   * (in milliseconds).
   */
  public get timeRemaining(): number {
    let { state, end } = this
    // Initialize the time cursor to the current time.
    let timeCursor: number = Date.now()

    // If aborted, then the time cursor should
    // be set to the time the action was aborted.
    if (state.status === 'aborted') {
      timeCursor = state.abortedAt
    }

    if (end < timeCursor) {
      return 0
    } else {
      return end - timeCursor
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
   * @param _id The ID of the execution.
   * @param action The action to execute.
   * @param start The timestamp for when the action began executing.
   * @param end The timestamp for when the action is expected to
   * finish
   */
  public constructor(
    _id: string,
    action: TAction<T>,
    start: number,
    end: number,
  ) {
    this._id = _id
    this.action = action
    this._outcome = null
    this.start = start
    this.end = end
  }

  /**
   * Converts the action execution to JSON.
   * @returns The JSON representation of the action execution.
   */
  public toJson(): TActionExecutionJson {
    return {
      _id: this._id,
      actionId: this.actionId,
      nodeId: this.nodeId,
      start: this.start,
      end: this.end,
      outcome: this.outcome?.toJson() ?? null,
    }
  }

  /**
   * Processes an outcome that occurs after the
   * execution object was created.
   * @param outcome The outcome of the action execution.
   * @throws If an outcome has already been processed.
   */
  public onOutcome(outcome: T['outcome']): void {
    // If an outcome has already been processed, ignore
    // this outcome, logging a warning.
    if (this.outcome) {
      console.warn('Outcome already processed. Ignoring new outcome.')
      return
    }
    // Set the outcome.
    this._outcome = outcome
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
export type TActionExecutionJson = TCreateMissionJsonType<
  ActionExecution,
  '_id' | 'actionId' | 'nodeId' | 'start' | 'end',
  { outcome: TExecutionOutcomeJson | null }
>

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
 * Execution-specific state possiblilities. States that
 * aren't possible for an execution outcome.
 */
type TActionExecutionStateBase = { status: 'executing' }

/**
 * Possible states for an action execution.
 * @note An execution-state will be the state of the
 * outcome if an outcome is present.
 */
export type TActionExecutionState = TActionExecutionStateBase | TOutcomeState
