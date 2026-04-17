import { MetisComponent } from '@shared/MetisComponent'
import type { TMission } from '../Mission'
import type { TNode } from '../nodes/MissionNode'
import { ActionResourceCost } from './ActionResourceCost'
import type {
  TExecutionOutcomeJson,
  TOutcome,
  TOutcomeState,
} from './ExecutionOutcome'
import {
  type TAction,
  type TActionModifier,
  type TActionModifierType,
  MissionAction,
} from './MissionAction'

/* -- CLASSES -- */

/**
 * The execution of an action.
 */
export abstract class ActionExecution<
  T extends TMetisBaseComponents = TMetisBaseComponents,
> extends MetisComponent {
  // Overridden
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
   * The node upon which the execution takes place.
   */
  public get node(): TNode<T> {
    return this.action.node
  }

  /**
   * The mission in which the execution takes place.
   */
  public get mission(): TMission<T> {
    return this.node.mission
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
   * The process time for this execution, computed from the action's
   * base process time plus any process-time modifiers that were
   * applied at or before this execution began.
   */
  public get effectiveProcessTime(): number {
    return Math.min(
      Math.max(
        this.action.baseProcessTime + this.getEffectiveOperand('process-time'),
        MissionAction.PROCESS_TIME_MIN,
      ),
      MissionAction.PROCESS_TIME_MAX,
    )
  }

  /**
   * The success chance for this execution, computed from the action's
   * base success chance plus any success-chance modifiers that were
   * applied at or before this execution began.
   */
  public get effectiveSuccessChance(): number {
    return Math.min(
      Math.max(
        this.action.baseSuccessChance +
          this.getEffectiveOperand('success-chance'),
        MissionAction.SUCCESS_CHANCE_MIN,
      ),
      MissionAction.SUCCESS_CHANCE_MAX,
    )
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
    super(_id, '', false)

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
   * @returns the sum of modifier amounts of the given type that were
   * applied at or before this execution's start timestamp.
   * @param type The modifier type to filter by.
   */
  private getEffectiveOperand(type: TActionModifierType): number {
    return this.action.modifiers
      .filter(
        (modifier: TActionModifier) =>
          modifier.type === type && modifier.appliedAt <= this.start,
      )
      .reduce(
        (sum: number, modifier: TActionModifier) => sum + modifier.amount,
        0,
      )
  }

  /**
   * @param resourceId The ID of the resource whose cost to compute.
   * @returns Returns the effective resource cost for the given resource at the
   * time this execution began, computed from the matching
   * {@link ActionResourceCost}'s base amount plus any resource-cost
   * modifiers that were applied at or before this execution began.
   * @note `0` is returned if no matching cost can be found.
   */
  public getEffectiveResourceCost(resourceId: string): number {
    const cost = this.action.resourceCosts.find(
      (resourceCost) => resourceCost.resourceId === resourceId,
    )
    if (!cost) return 0
    return cost.getEffectiveAmount(this.start)
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
 * Extracts the execution type from a registry of
 * METIS components that extends `TMetisBaseComponents`.
 * @param T The type registry.
 * @returns The execution type.
 */
export type TExecution<T extends TMetisBaseComponents> = T['execution']

/**
 * The JSON representation of an action execution.
 */
export type TActionExecutionJson = TCreateJsonType<
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
