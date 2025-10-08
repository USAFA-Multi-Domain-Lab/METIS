import { TMetisClientComponents } from 'src'
import { ClientTargetEnvironment } from 'src/target-environments'
import ClientTarget from 'src/target-environments/targets'
import ClientMission from '..'
import Effect, {
  TEffectExecutionTriggered,
  TEffectExecutionTriggeredJson,
  TEffectSessionTriggered,
  TEffectSessionTriggeredJson,
  TEffectTriggerData,
  TTriggerDataExecution,
  TTriggerDataSession,
} from '../../../../shared/missions/effects'
import ClientMissionAction from '../actions'

/**
 * Class representing an effect on the client-side that can be
 * applied to a target.
 */
export class ClientEffect<
  TTriggerData extends TEffectTriggerData<TMetisClientComponents> = TEffectTriggerData<TMetisClientComponents>,
> extends Effect<TMetisClientComponents, TTriggerData> {
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
  public duplicate(
    options: TDuplicateEffectOptions<TTriggerData>,
  ): ClientEffect<TTriggerData> {
    // Gather details.
    const {
      triggerData = this.triggerData,
      name = this.name,
      localKey = this.localKey,
    } = options

    return new ClientEffect<TTriggerData>(
      ClientEffect.DEFAULT_EXEC_PROPERTIES._id,
      name,
      this.targetId,
      this.environmentId,
      this.targetEnvironmentVersion,
      this.description,
      triggerData,
      this.args,
      localKey,
    )
  }

  /**
   * @param target The target for the new effect.
   * @param mission The mission that will host the effect.
   * @returns A new effect with the provided target for
   * a session, with session-lifecycle trigger,
   * populated with the corresponding mission and target
   * information. Non-mission and non-target specific values
   * will be populated with {@link ClientEffect.DEFAULT_SESSION_PROPERTIES}.
   */
  public static createBlankSessionEffect(
    target: ClientTarget,
    mission: ClientMission,
    trigger: TEffectSessionTriggered,
  ): ClientEffect<TTriggerDataSession<TMetisClientComponents>> {
    return new ClientEffect(
      ClientEffect.DEFAULT_SESSION_PROPERTIES._id,
      ClientEffect.DEFAULT_SESSION_PROPERTIES.name,
      target._id,
      target.environment._id,
      target.environment.version,
      ClientEffect.DEFAULT_SESSION_PROPERTIES.description,
      {
        trigger,
        sourceMission: mission,
      },
      ClientEffect.DEFAULT_SESSION_PROPERTIES.args,
      mission.generateEffectKey(),
    )
  }

  /**
   * @param target The target for the new effect.
   * @param action The action that will host the effect.
   * @returns A new effect with the provided target for
   * an action, with execution-lifecycle trigger,
   * populated with the corresponding action and target
   * information. Non-action and non-target specific values
   * will be populated with {@link ClientEffect.DEFAULT_EXEC_PROPERTIES}.
   */
  public static createBlankExecutionEffect(
    target: ClientTarget,
    action: ClientMissionAction,
    trigger: TEffectExecutionTriggered,
  ): ClientEffect<TTriggerDataExecution<TMetisClientComponents>> {
    return new ClientEffect(
      ClientEffect.DEFAULT_EXEC_PROPERTIES._id,
      ClientEffect.DEFAULT_EXEC_PROPERTIES.name,
      target._id,
      target.environment._id,
      target.environment.version,
      ClientEffect.DEFAULT_EXEC_PROPERTIES.description,
      {
        trigger,
        sourceAction: action,
      },
      ClientEffect.DEFAULT_EXEC_PROPERTIES.args,
      action.generateEffectKey(),
    )
  }

  /**
   * @param json The JSON from which to create the effect.
   * @param sourceMission The mission to which the effect belongs.
   * @returns The effect created from the JSON.
   */
  public static fromSessionTriggeredJson(
    json: TEffectSessionTriggeredJson,
    sourceMission: ClientMission,
  ): ClientEffect<TTriggerDataSession<TMetisClientComponents>> {
    return new ClientEffect(
      json._id,
      json.name,
      json.targetId,
      json.environmentId,
      json.targetEnvironmentVersion,
      json.description,
      { trigger: json.trigger, sourceMission },
      json.args,
      json.localKey,
    )
  }

  /**
   * @param json The JSON from which to create the effect.
   * @param action The action to which the effect belongs.
   * @returns The effect created from the JSON.
   */
  public static fromExecutionTriggeredJson(
    json: TEffectExecutionTriggeredJson,
    sourceAction: ClientMissionAction,
  ): ClientEffect<TTriggerDataExecution<TMetisClientComponents>> {
    return new ClientEffect(
      json._id,
      json.name,
      json.targetId,
      json.environmentId,
      json.targetEnvironmentVersion,
      json.description,
      { trigger: json.trigger, sourceAction },
      json.args,
      json.localKey,
    )
  }
}

/* ------------------------------ CLIENT EFFECT TYPES ------------------------------ */

/**
 * The options for duplicating an effect.
 * @see {@link ClientEffect.duplicate}
 */
type TDuplicateEffectOptions<
  TTriggerData extends TEffectTriggerData<TMetisClientComponents>,
> = {
  /**
   * @see {@link ClientEffect.triggerData}
   */
  triggerData?: TTriggerData
  /**
   * @see {@link ClientEffect.name}
   */
  name?: string
  /**
   * @see {@link ClientEffect.localKey}
   */
  localKey?: string
}

/**
 * Client implementation of {@link TTriggerDataSession}.
 */
export type TClientTriggerDataSession =
  TTriggerDataSession<TMetisClientComponents>

/**
 * Client implementation of {@link TTriggerDataExecution}.
 */
export type TClientTriggerDataExec =
  TTriggerDataExecution<TMetisClientComponents>
