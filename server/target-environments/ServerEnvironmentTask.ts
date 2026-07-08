import type { SessionServer } from '@server/sessions/SessionServer'
import {
  TargetEnvironmentTask,
  type TEnvironmentTaskError,
  type TEnvironmentTaskSource,
} from '@shared/target-environments/TargetEnvironmentTask'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
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
    source: TEnvironmentTaskSource,
    private readonly script: () => Promise<void>,
  ) {
    super(_id, environment, session, 'queued', null, source)
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
   * (broadcast before execution) and then to `success` or `failure`
   * (broadcast once it settles).
   * @resolves After the script has run successfully.
   * @rejects If the script fails.
   */
  public async run(): Promise<void> {
    // Surface the task as running before the script executes.
    this.markStarted()
    this.session.broadcastTask(this)

    try {
      await this.script()
      this.markSucceeded()
      this.session.broadcastTask(this)
    } catch (error: unknown) {
      let scriptError: TEnvironmentTaskError =
        error instanceof Error
          ? error
          : new Error(StringToolbox.limit(`${error}`, 128))
      this.markFailed(scriptError)
      this.session.broadcastTask(this)
      throw error
    }
  }

  /**
   * Skips this task, transitioning it from `queued` to `skipped` and
   * broadcasting it. Used when a task is bypassed without running (e.g. a
   * prior task failed, or it has unresolved issues).
   */
  public skip(): void {
    this.markSkipped()
    this.session.broadcastTask(this)
  }

  /**
   * Creates a queued, runnable task.
   * @param session The session this task belongs to, used to broadcast
   * lifecycle transitions to authorized members.
   * @param environment The environment to which this task pertains.
   * @param source What produced this task.
   * @param script The script to run when this task is executed.
   */
  public static create(
    session: SessionServer,
    environment: ServerTargetEnvironment,
    source: TEnvironmentTaskSource,
    script: () => Promise<void>,
  ): ServerEnvironmentTask {
    return new ServerEnvironmentTask(
      StringToolbox.generateRandomId(),
      environment,
      session,
      source,
      script,
    )
  }
}
