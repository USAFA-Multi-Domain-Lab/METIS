import { targetEnvLogger } from '@server/logging'
import type { SessionServer } from '@server/sessions/SessionServer'
import {
  TargetEnvironmentTask,
  type TEnvironmentTaskError,
  type TEnvironmentTaskSource,
  type TEnvironmentTaskStatus,
} from '@shared/target-environments/TargetEnvironmentTask'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import { OutdatedContextError } from './context/OutdatedContextError'
import {
  TargetScriptContext,
  type TEffectContextOptions,
} from './context/TargetScriptContext'
import type { ServerTargetEnvironment } from './ServerTargetEnvironment'

/**
 * A server-side extension of {@link TargetEnvironmentTask} with
 * an executable script.
 */
export class ServerEnvironmentTask extends TargetEnvironmentTask<TMetisServerComponents> {
  /**
   * @param script The script to run when this task is executed.
   */
  private constructor(
    _id: string,
    environment: ServerTargetEnvironment,
    session: SessionServer,
    realmName: string,
    source: TEnvironmentTaskSource,
    /**
     * The script that is executed by the
     * {@link ServerEnvironmentTask.run} method.
     */
    private readonly script: () => Promise<void>,
    /**
     * A script that is executed before the task is actually
     * run which provides the opportunity for validation logic.
     * If `true` is returned/resolved, the task will be skipped and the
     * main script will never run.
     */
    private readonly shouldSkip: () => Promise<boolean> | boolean,
  ) {
    super(_id, environment, session, realmName, 'queued', null, source)
  }

  /**
   * Announces this task in its current (`queued`) state, so authorized
   * members see it appear in the list awaiting initiation before any
   * task in the batch begins running.
   */
  public announce(): void {
    this.session.broadcastTask(this)
  }

  /**
   * Executes the bound script, transitioning from `queued` to `running`
   * (broadcast before execution) and then to `success`, `failure`, or
   * `skipped` (broadcast once it settles). A script failure is recorded on
   * the task rather than raised — inspect the returned status (or
   * {@link error}) to react to it.
   * @returns The terminal status the task settled into.
   * @throws If the task is not `queued` when called. This signals misuse
   * (running a task twice or out of order), not a script failure.
   */
  public async run(): Promise<TEnvironmentTaskStatus> {
    if (this.status !== 'queued') {
      throw new Error("Cannot run a task unless it is in a 'queued' state.")
    }

    try {
      let skip = await this.shouldSkip()
      if (skip) {
        this.markSkipped()
      } else {
        this.markStarted()
        await this.script()
        this.markSucceeded()
      }
    } catch (error) {
      let scriptError: TEnvironmentTaskError =
        error instanceof Error
          ? error
          : new Error(StringToolbox.limit(`${error}`, 128))
      this.markFailed(scriptError)
    }

    return this.status
  }

  // Overridden
  public override markStarted(): this {
    super.markStarted()
    this.session.broadcastTask(this)
    return this
  }

  // Overridden
  public override markSkipped(): this {
    super.markSkipped()
    this.session.broadcastTask(this)
    return this
  }

  // Overridden
  public override markSucceeded(): this {
    super.markSucceeded()
    this.session.broadcastTask(this)
    return this
  }

  // Overridden
  public override markFailed(error: TEnvironmentTaskError): this {
    super.markFailed(error)
    this.session.broadcastTask(this)
    return this
  }

  /**
   * Runs the given tasks one after another. When `stopOnFailure` is set,
   * a failing task causes the remaining tasks to be skipped rather than
   * run — used for hook batches, where a failed hook may leave the
   * environment in an unusable state.
   * @param tasks The queued tasks to run, in order.
   * @param options.stopOnFailure Whether to skip the remaining tasks once
   * one fails. Defaults to `false`.
   * @resolves When every task has settled (run or skipped).
   */
  public static async runInSequence(
    tasks: ServerEnvironmentTask[],
    options: { stopOnFailure?: boolean } = {},
  ): Promise<void> {
    let { stopOnFailure = false } = options
    let failed = false
    for (let task of tasks) {
      if (failed) {
        task.markSkipped()
        continue
      }

      // The task settles and broadcasts itself (queued -> running ->
      // success/failure/skipped) and reports its terminal status. A failure
      // short-circuits the batch when stopping on failure.
      let status = await task.run()
      if (status === 'failure' && stopOnFailure) failed = true
    }
  }

  /**
   * Creates a queued, runnable task.
   * @param session The session this task belongs to, used to broadcast
   * lifecycle transitions to authorized members.
   * @param environment The environment to which this task pertains.
   * @param realmName The name of the realm this task belongs to.
   * @param source What produced this task.
   * @param script The script to run when this task is executed.
   */
  public static create(
    session: SessionServer,
    environment: ServerTargetEnvironment,
    realmName: string,
    source: TEnvironmentTaskSource,
    script: () => Promise<void>,
    options: TTaskCreateOptions = {},
  ): ServerEnvironmentTask {
    const { shouldSkip = () => false } = options
    return new ServerEnvironmentTask(
      StringToolbox.generateRandomId(),
      environment,
      session,
      realmName,
      source,
      script,
      shouldSkip,
    )
  }

  /**
   * Builds a queued task for an effect, binding the effect's target script
   * and context to it. The task is announced and run later, as part of a
   * batch.
   * @param options The effect and its trigger-specific inputs.
   * @returns The queued effect task.
   * @throws If the effect has no target environment or target.
   */
  public static forEffect(
    options: TEffectContextOptions,
  ): ServerEnvironmentTask {
    let { effect } = options
    // A target environment and target are required to run the effect.
    if (effect.environment === null) {
      throw new Error(
        `"${effect.name}" doesn't have a target environment or the target environment doesn't exist.`,
      )
    }
    if (effect.target === null) {
      throw new Error(
        `"${effect.name}" doesn't have a target or the target doesn't exist.`,
      )
    }

    // The context knows how to build itself from the trigger-specific
    // inputs; the task only wraps its execution.
    let context = TargetScriptContext.forEffect(options)
    let session = context.session

    // Describe the source of this execution so managers can review and
    // diagnose the effect application.
    let source: TEnvironmentTaskSource = {
      kind: 'effect',
      effectName: effect.name,
      targetName: effect.target.name,
      trigger: effect.trigger,
    }

    // Captured here so the narrowed (non-null) target is bound into the
    // deferred script, which runs later as part of the batch.
    let script = effect.target.script
    return ServerEnvironmentTask.create(
      session,
      effect.environment,
      context.realm.name,
      source,
      async () => {
        try {
          await context.run(script)
        } catch (error) {
          // The task itself records the failure; here we only annotate
          // the log with effect-location context for stale-context
          // errors, which typically stem from delayed async work in a
          // prior instance. Rethrow so the task settles as a failure.
          if (error instanceof OutdatedContextError) {
            let message =
              `Failed to apply effect - "${effect.name}" - to target - "${effect.target?.name}" - found in the environment - "${effect.environment?.name}".\n` +
              `The effect - "${effect.name}" - can be found here:\n` +
              `${effect.pathFormatted}\n`
            targetEnvLogger.error(message, error)
          }
          throw error
        }
      },
      {
        // Skip the effect if it (or any of its arguments) has unresolved
        // issues, or if the session has left a state that permits this
        // trigger (e.g. it ended before this task's turn in the batch came
        // up).
        shouldSkip: () => effect.shouldSkip || !context.currentStatePermitted,
      },
    )
  }
}

/* -- TYPES -- */

/**
 * Additional options to pass to {@link ServerEnvironmentTask.create}
 * to customize the task created.
 */
export type TTaskCreateOptions = {
  /**
   * A script that is executed before the task is actually
   * run which provides the opportunity for validation logic.
   * If `true` is returned/resolved, the task will be skipped and the
   * main script will never run.
   * @default () => false
   */
  shouldSkip?: () => Promise<boolean> | boolean
}
