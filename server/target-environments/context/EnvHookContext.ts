import type { TSessionState } from '@shared/sessions/MissionSession'
import { SessionServer } from '../../sessions/SessionServer'
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

  // Implemented
  protected get environmentId(): string {
    return this.environment._id
  }

  /**
   * The target environment for the registered hook
   * that will receive this context.
   */
  protected readonly environment: ServerTargetEnvironment

  /**
   * @param session The session for the current context.
   * @param environment The target environment for the current context.
   */
  public constructor(
    session: SessionServer,
    environment: ServerTargetEnvironment,
  ) {
    super(session)
    this.environment = environment
  }

  // Implemented
  protected expose(): TEnvHookExposedContext {
    return {
      ...this.exposeCommon(),
    }
  }
}

/* -- TYPES -- */

/**
 * Data exposed to a target-environment hook as an object.
 */
export interface TEnvHookExposedContext extends TTargetEnvExposedContext {}
