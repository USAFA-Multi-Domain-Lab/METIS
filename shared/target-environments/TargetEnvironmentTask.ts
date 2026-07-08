import type { TSessionState } from '@shared/sessions/MissionSession'
import { MetisComponent } from '../MetisComponent'
import type { TEffectTrigger } from '../missions/effects/Effect'

/**
 * Represents a single target-environment task, produced by a
 * target-environment-related script (a lifecycle hook or an effect),
 * tracked throughout its lifecycle: it is enumerated up front as
 * `queued` (awaiting initiation), transitioned to `running` when it
 * begins executing, and finally resolved (`success`/`failure`/`skipped`).
 * @note The same instance is transitioned in place as the task
 * progresses, so its `_id` remains stable across updates. This lets
 * authorized clients render a queued row, watch it start, and update it
 * upon resolution rather than appending a duplicate.
 */
export abstract class TargetEnvironmentTask<
  T extends TMetisBaseComponents,
> extends MetisComponent {
  // Overridden
  public override get name(): string {
    switch (this.source.kind) {
      case 'hook':
        return `${this.environment.name}`
      case 'effect':
        return `${this.source.effectName}`
      default:
        return 'Unknown task'
    }
  }

  /**
   * @see {@link TargetEnvironmentTask.status}
   */
  private _status: TEnvironmentTaskStatus
  /**
   * The status indicating where this task is in its lifecycle.
   */
  public get status(): TEnvironmentTaskStatus {
    return this._status
  }

  /**
   * @see {@link TargetEnvironmentTask.error}
   */
  private _error: TEnvironmentTaskError | null
  /**
   * The error which caused the script to fail, if any.
   * @note This is null unless the status is 'failure'.
   */
  public get error(): TEnvironmentTaskError | null {
    return this._error
  }

  /**
   * A human-readable description of the task's current status.
   */
  public get statusDescription(): string {
    switch (this._status) {
      case 'success':
        return 'Complete.'
      case 'failure':
        return 'Failed.'
      case 'queued':
        return 'Awaiting initiation…'
      case 'running':
        return 'In progress…'
      case 'skipped':
        return 'Skipped.'
      default:
        return 'Unknown status.'
    }
  }

  /**
   * The version of the environment to which this task pertains.
   */
  public get environmentVersion(): string {
    return this.environment.version
  }

  /**
   * When during the session this task is scheduled to run or
   * has already run, either during setup, teardown, or
   * live execution. This is determined from the {@link source}
   * of the task.
   */
  public get phase(): TEnvironmentTaskPhase {
    if (this.source.kind === 'hook') {
      return this.source.method === 'environment-setup' ? 'setup' : 'teardown'
    }
    switch (this.source.trigger) {
      case 'session-setup':
        return 'setup'
      case 'session-teardown':
        return 'teardown'
      default:
        return 'live'
    }
  }

  protected constructor(
    _id: string,
    /**
     * The environment to which this task pertains.
     */
    public readonly environment: T['targetEnv'],
    /**
     * The session in which this task is running.
     */
    public readonly session: T['session'],
    status: TEnvironmentTaskStatus,
    error: TEnvironmentTaskError | null,
    /**
     * Describes what produced this task (a lifecycle hook or an
     * effect), including the context needed to present it.
     */
    public readonly source: TEnvironmentTaskSource,
  ) {
    // A generated ID is used because a single environment can produce
    // multiple tasks, so the environment's ID would not uniquely
    // identify one. The ID is serialized so it stays stable across the
    // wire and across the queued -> running -> resolved transitions.
    // Name is overwritten, so a blank string is used here.
    super(_id, '', false)
    this._status = status
    this._error = error
  }

  /**
   * Transitions this task from `queued` to `running`, marking the point
   * at which its script begins executing.
   * @returns This instance, for chaining.
   */
  public markStarted(): this {
    this._status = 'running'
    this._error = null
    return this
  }

  /**
   * Transitions this task to a skipped state, indicating its script was
   * never executed (e.g. a prior task failed or it had unresolved issues).
   * @returns This instance, for chaining.
   */
  public markSkipped(): this {
    this._status = 'skipped'
    this._error = null
    return this
  }

  /**
   * Transitions this task to a successful state.
   * @returns This instance, for chaining.
   */
  public markSucceeded(): this {
    this._status = 'success'
    this._error = null
    return this
  }

  /**
   * Transitions this task to a failed state.
   * @param error The error which caused the script to fail.
   * @returns This instance, for chaining.
   */
  public markFailed(error: TEnvironmentTaskError): this {
    this._status = 'failure'
    this._error = error
    return this
  }

  /**
   * @returns The JSON-serializable representation of this task.
   */
  public toJson(): TEnvironmentTaskJson {
    let json: TEnvironmentTaskJson = {
      _id: this._id,
      environmentId: this.environment._id,
      sessionId: this.session._id,
      status: this._status,
      error: null,
      source: this.source,
    }

    // Include error details if present.
    if (this._error) {
      json.error = {
        name: this._error.name,
        message: this._error.message,
        stack: this._error.stack,
        code: this._error?.code,
      }
    }

    return json
  }
}

/* -- TYPES -- */

/**
 * Valid statuses for an {@link TargetEnvironmentTask}.
 * @options
 * - `'queued'` while the script is awaiting initiation.
 * - `'running'` while the script is executing.
 * - `'success'` once it resolves without error.
 * - `'failure'` if it throws.
 * - `'skipped'` if it was never executed.
 */
export type TEnvironmentTaskStatus =
  | 'queued'
  | 'running'
  | 'success'
  | 'failure'
  | 'skipped'

/**
 * Serializable representation of {@link TargetEnvironmentTask}.
 */
export type TEnvironmentTaskJson = {
  /**
   * The stable ID of the task, preserved across updates so clients can
   * reconcile a queued/running row with its resolution.
   */
  _id: string
  /**
   * The ID of the environment to which this task pertains.
   */
  environmentId: string
  /**
   * The ID of the session in which this task is running.
   */
  sessionId: string
  /**
   * Indicates where the task is in its lifecycle.
   * @see {@link TEnvironmentTaskStatus}
   */
  status: TEnvironmentTaskStatus
  /**
   * The error which caused the script to fail, if any.
   */
  error: TEnvironmentTaskError | null
  /**
   * Describes what produced this task.
   * @see {@link TEnvironmentTaskSource}
   */
  source: TEnvironmentTaskSource
}

/**
 * Describes the origin of an {@link TargetEnvironmentTask}, carrying
 * the contextual details needed to present it to authorized users.
 * @options
 * - `'hook'` for lifecycle hooks (setup/teardown)
 * - `'effect'` for effects.
 */
export type TEnvironmentTaskSource =
  | {
      /**
       * Indicates the task came from a target-environment lifecycle hook.
       */
      kind: 'hook'
      /**
       * The lifecycle method the hook belongs to.
       */
      method: TTargetEnvironmentMethods
    }
  | {
      /**
       * Indicates the task came from an effect.
       */
      kind: 'effect'
      /**
       * The name of the effect that was applied.
       */
      effectName: string
      /**
       * The name of the target the effect was applied to.
       */
      targetName: string
      /**
       * The trigger that caused the effect to be applied.
       */
      trigger: TEffectTrigger
    }

/**
 * Valid methods for target-environment hooks.
 */
export type TTargetEnvironmentMethods =
  | 'environment-setup'
  | 'environment-teardown'

/**
 * Describes which part of the session's lifecycle a task belongs to:
 * its setup, its teardown, or its live (in-session) play.
 * @note This is slightly different than {@link TSessionState} because a
 * session state is the session's single, authoritative runtime status
 * at a given moment — a state machine that includes transitional states
 * such as `starting`, `ending`, and `resetting`. A task phase is a
 * coarser classification of the lifecycle stage that produced a task; it
 * is derived from the task's source rather than stored, and does not map
 * one-to-one onto states. For example, the `resetting` state produces
 * both `setup` and `teardown` tasks (a reset tears down, then sets back
 * up), while the `live` phase corresponds to the `started` state.
 * @see {@link TargetEnvironmentTask.phase}
 */
export type TEnvironmentTaskPhase = 'setup' | 'teardown' | 'live'

/**
 * Represents an error that occurred during the execution of a target script.
 */
export type TEnvironmentTaskError = Error & {
  /**
   * The error code associated with the failure, if available.
   */
  code?: string
}
