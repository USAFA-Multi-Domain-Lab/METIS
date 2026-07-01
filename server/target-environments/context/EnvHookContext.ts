import type { ServerSessionRealm } from '@server/sessions/ServerSessionRealm'
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

  // Implemented
  protected expose(): TEnvHookExposedContext {
    return {
      ...this.exposeCommon(),
    }
  }

  /**
   * Creates a new {@link EnvHookContext}.
   * @param realm The realm within which the target environment is being used.
   * @param environment The target environment to which this context can be exposed.
   * @returns The the context created.
   */
  public static create(
    realm: ServerSessionRealm,
    environment: ServerTargetEnvironment,
  ): EnvHookContext {
    return new EnvHookContext(realm, environment)
  }
}

/* -- TYPES -- */

/**
 * Data exposed to a target-environment hook as an object.
 */
export interface TEnvHookExposedContext extends TTargetEnvExposedContext {}
