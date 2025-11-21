import { SessionServer } from '@server/sessions/SessionServer'
import type { TSessionState } from '@shared/sessions/MissionSession'
import type { ServerTargetEnvironment } from '../ServerTargetEnvironment'
import type { TTargetEnvExposedContext } from './TargetEnvContext'
import { TargetEnvContext } from './TargetEnvContext'

/**
 * Context that is provided to target scripts when
 * they are called during a session.
 */
export class EnvHookContext extends TargetEnvContext<TEnvHookExposedContext> {
  // Implemented
  protected get permittedStates(): TSessionState[] {
    return SessionServer.AVAILABLE_STATES
  }

  /**
   * @param session The session for the current context.
   * @param environment The target environment for the current context.
   */
  public constructor(
    session: SessionServer,
    environment: ServerTargetEnvironment,
  ) {
    super(session, environment)
  }

  // Implemented
  protected expose(): TEnvHookExposedContext {
    return {
      ...this.exposeCommon(),
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
export interface TEnvHookExposedContext extends TTargetEnvExposedContext {}
