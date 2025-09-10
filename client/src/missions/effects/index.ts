import { TMetisClientComponents } from 'src'
import { ClientTargetEnvironment } from 'src/target-environments'
import ClientTarget from 'src/target-environments/targets'
import { TCreateJsonType } from '../../../../shared'
import Effect, {
  TEffectJson,
  TEffectJsonDirect,
  TEffectJsonIndirect,
} from '../../../../shared/missions/effects'
import ClientMissionAction from '../actions'

/**
 * Class representing an effect on the client-side that can be
 * applied to a target.
 */
export class ClientEffect extends Effect<TMetisClientComponents> {
  /**
   * @param action The action that the effect belongs to.
   * @param data The effect data from which to create the effect.
   */
  public constructor(action: ClientMissionAction, data: TClientEffectJson) {
    super(action, data)
  }

  // Implemented
  protected determineTarget(
    targetId: string,
    environmentId: string,
  ): ClientTarget | null {
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
   * Duplicates the effect, creating a new effect with the same properties
   * as this one or with the provided properties.
   * @param options The options for duplicating the effect.
   * @param options.action The action to which the duplicated effect belongs.
   * @param options.name The name of the duplicated effect.
   * @param options.localKey The local key of the duplicated effect.
   * @returns A new effect with the same properties as this one or with the
   * provided properties.
   */
  public duplicate(options: TDuplicateEffectOptions): ClientEffect {
    // Gather details.
    const {
      action = this.action,
      name = this.name,
      localKey = this.localKey,
    } = options

    const data = {
      ...this.toJson(),
      name,
      localKey,
      _id: ClientEffect.DEFAULT_PROPERTIES._id,
    }

    return new ClientEffect(action, data)
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
    let data: TClientEffectJson = {
      ...ClientEffect.DEFAULT_PROPERTIES,
      _id: ClientEffect.DEFAULT_PROPERTIES._id,
      name: ClientEffect.DEFAULT_PROPERTIES.name,
      description: ClientEffect.DEFAULT_PROPERTIES.description,
      args: ClientEffect.DEFAULT_PROPERTIES.args,
      trigger: ClientEffect.DEFAULT_PROPERTIES.trigger,
      targetId: target._id,
      environmentId: target.environment._id,
      targetEnvironmentVersion: target.environment.version,
      localKey: action.generateEffectKey(),
    }
    return new ClientEffect(action, data)
  }
}

/* ------------------------------ CLIENT EFFECT TYPES ------------------------------ */

/**
 * The JSON representation of an `Effect` object.
 * @note This is a carbon copy of the `TEffectJson` type
 * from the shared library and is used to temporarily fix the
 * any issue that happens when importing from the shared
 * library.
 * @see {@link TEffectJson}
 */
type TClientEffectJson = TCreateJsonType<
  ClientEffect,
  TEffectJsonDirect,
  TEffectJsonIndirect
>

/**
 * The options for duplicating an effect.
 * @see {@link ClientEffect.duplicate}
 */
type TDuplicateEffectOptions = {
  /**
   * The action to which the duplicated effect belongs.
   */
  action?: ClientMissionAction
  /**
   * The name of the duplicated effect.
   */
  name?: string
  /**
   * The local key of the duplicated effect.
   */
  localKey?: string
}
