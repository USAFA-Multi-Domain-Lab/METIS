import type { SessionServer } from '@server/sessions/SessionServer'
import type { TargetEnvStore } from '../../sessions/TargetEnvStore'
import type { ServerTargetEnvironment } from '../ServerTargetEnvironment'
import type {
  TTargetEnvExposedConfig,
  TTargetEnvExposedSession,
} from './TargetEnvContext'
import {
  TargetEnvContext,
  type TTargetEnvExposedMission,
} from './TargetEnvContext'

/**
 * Context that is provided to target scripts when
 * they are called during a session.
 */
export class EnvHookContext extends TargetEnvContext<TEnvHookExposedContext> {
  /**
   * Creates a limited context to expose to the target
   * environment scripts.
   */
  public expose(): TEnvHookExposedContext {
    return {
      session: this.session.toTargetEnvContext(),
      mission: this.mission.toTargetEnvContext(),
      localStore: this.localStore,
      globalStore: this.globalStore,
      targetEnvConfigs: this.targetEnvConfigs,
      selectedTargetEnvConfig: this.selectedTargetEnvConfig,
    }
  }

  /**
   * Creates a new `EnvHookContext`.
   * @param session The session for the current context.
   * @param environment The target environment for the current context.
   * @returns The new `EnvHookContext`.
   */
  public static create(
    session: SessionServer,
    environment: ServerTargetEnvironment,
  ): EnvHookContext {
    return new EnvHookContext(session, environment)
  }
}

/* -- TYPES -- */

/**
 * Data exposed to a target-environment hook as an object.
 */
export type TEnvHookExposedContext = {
  /**
   * The session that invoked the hook.
   */
  readonly session: TTargetEnvExposedSession
  /**
   * The mission associated with the session.
   */
  readonly mission: TTargetEnvExposedMission
  /**
   * A store that is unique to the session and target environment.
   * This can be used to store and retrieve temporary, random-access
   * data.
   */
  readonly localStore: TargetEnvStore
  /**
   * A store that is unique to the session, but not to any particular
   * target environment. This allows for data to be shared across different
   * target environments within the same session.
   */
  readonly globalStore: TargetEnvStore
  /**
   * This list of configurations for this context's target environment
   * that's used within the current session.
   */
  readonly targetEnvConfigs: TTargetEnvExposedConfig[]
  /**
   * The configuration that's been selected for this context's target
   * environment that's used within the current session.
   */
  readonly selectedTargetEnvConfig: TTargetEnvExposedConfig | null
}
