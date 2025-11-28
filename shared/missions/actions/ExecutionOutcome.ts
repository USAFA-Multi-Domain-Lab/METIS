import { MetisComponent } from '../../MetisComponent'
import type { TForce } from '../forces/MissionForce'
import type { TNode } from '../nodes/MissionNode'
import type { TExecution } from './ActionExecution'
import type { TAction } from './MissionAction'

/**
 * The outcome of an action being executed.
 */
export abstract class ExecutionOutcome<
  T extends TMetisBaseComponents = TMetisBaseComponents,
> extends MetisComponent {
  // Overridden
  public get name(): string {
    return this._id.substring(0, 8)
  }

  /**
   * Cache for `state` field.
   */
  protected _state: TOutcomeState
  /**
   * The state of the outcome.
   */
  public get state(): TOutcomeState {
    return this._state
  }

  /**
   * The status of the outcome, determined
   * by the state.
   */
  public get status(): TOutcomeState['status'] {
    return this.state.status
  }

  /**
   * The execution associated with the outcome.
   */
  public readonly execution: TExecution<T>

  /**
   * The ID of the execution associated with the outcome.
   */
  public get executionId(): MetisComponent['_id'] {
    return this.execution._id
  }

  /**
   * The action executed.
   */
  public get action(): TAction<T> {
    return this.execution.action
  }

  /**
   * The ID of the action executed.
   */
  public get actionId(): MetisComponent['_id'] {
    return this.action._id
  }

  /**
   * The node upon which the action executed.
   */
  public get node(): TNode<T> {
    return this.action.node
  }

  /**
   * The ID of the node upon which the action executed.
   */
  public get nodeId(): MetisComponent['_id'] {
    return this.node._id
  }

  /**
   * The force where the action executed.
   */
  public get force(): TForce<T> {
    return this.node.force
  }

  /**
   * The ID of the force where the action executed.
   */
  public get forceId(): MetisComponent['_id'] {
    return this.force._id
  }

  /**
   * @param initialState The initial state of the outcome, before
   * any modifications are made.
   * @param execution The execution associated with the outcome.
   */
  public constructor(
    _id: string,
    initialState: TOutcomeState,
    execution: TExecution<T>,
  ) {
    super(_id, '', false)

    this._state = initialState
    this.execution = execution
  }

  /**
   * Converts the execution outcome to JSON.
   */
  public toJson(): TExecutionOutcomeJson {
    return {
      _id: this._id,
      executionId: this.executionId,
      state: this.state,
    }
  }
}

/* -- TYPES -- */

/**
 * Extracts the outcome type from a registry of
 * METIS components that extends `TMetisBaseComponents`.
 * @param T The type registry.
 * @returns The outcome type.
 */
export type TOutcome<T extends TMetisBaseComponents> = T['outcome']

/**
 * The JSON representation of an execution outcome.
 */
export type TExecutionOutcomeJson = TCreateJsonType<
  ExecutionOutcome,
  '_id' | 'executionId' | 'state'
>

/**
 * Data associated with an outcome status.
 */
export type TOutcomeState =
  | {
      readonly status: 'success'
    }
  | {
      readonly status: 'failure'
    }
  | {
      readonly status: 'aborted'
      readonly abortedAt: number
    }
