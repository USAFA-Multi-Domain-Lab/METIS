import { TMetisClientComponents } from 'src'
import { ClientTargetEnvironment } from 'src/target-environments'
import ClientTarget from 'src/target-environments/targets'
import Effect, { TEffectJson } from '../../../../shared/missions/effects'
import ClientMissionAction from '../actions'

/**
 * Class representing an effect on the client-side that can be
 * applied to a target.
 */
export class ClientEffect extends Effect<TMetisClientComponents> {
  // Implemented
  protected determineTarget(
    targetId: string,
    environmentId: string,
  ): ClientTarget | null {
    // todo: Allow user to decide which target to use
    // todo: if multiple targets with the same ID exist
    // todo: in different environments
    if (environmentId === ClientEffect.ENVIRONMENT_ID_INFER) {
      return ClientTargetEnvironment.REGISTRY.inferTarget(targetId) ?? null
    } else {
      return (
        ClientTargetEnvironment.REGISTRY.getTarget(targetId, environmentId) ??
        null
      )
    }
  }

  /**
   * @param target The target for the new effect.
   * @param action The action that will trigger the effect.
   * @returns A new effect with the provided target,
   * populated with the corresponding target environment
   * and target environment version. All other values
   * will be set to the default values found in
   * `Effect.DEFAULT_PROPERTIES`.
   */
  public static createBlankEffect(
    target: ClientTarget,
    action: ClientMissionAction,
  ): ClientEffect {
    let data: TEffectJson = {
      ...Effect.DEFAULT_PROPERTIES,
      targetId: target._id,
      environmentId: target.environment._id,
      targetEnvironmentVersion: target.environment.version,
    }
    return new ClientEffect(action, data)
  }
}
