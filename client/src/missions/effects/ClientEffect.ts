import type { TMetisClientComponents } from '@client/index'
import type { ClientTarget } from '@client/target-environments/ClientTarget'
import { ClientTargetEnvironment } from '@client/target-environments/ClientTargetEnvironment'
import type {
  TEffectContextExecution,
  TEffectContextSession,
  TEffectExecutionTriggered,
  TEffectExecutionTriggeredJson,
  TEffectHost,
  TEffectSessionTriggered,
  TEffectSessionTriggeredJson,
  TEffectType,
  TSelectEffectContext,
} from '@shared/missions/effects/Effect'
import { Effect } from '@shared/missions/effects/Effect'
import type { ClientMission } from '../ClientMission'
import type { ClientMissionAction } from '../actions/ClientMissionAction'

/**
 * Class representing an effect on the client-side that can be
 * applied to a target.
 */
export class ClientEffect<
  TType extends TEffectType = TEffectType,
> extends Effect<TMetisClientComponents, TType> {
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
   * @returns A new effect with the same properties as this one or with the
   * provided properties.
   */
  public duplicate(
    options: TDuplicateEffectOptions<TType>,
  ): ClientEffect<TType> {
    // Gather details.
    const {
      context = this.context,
      name = this.name,
      localKey = this.localKey,
    } = options

    return new ClientEffect<TType>(
      ClientEffect.DEFAULT_EXEC_PROPERTIES._id,
      name,
      this.targetId,
      this.environmentId,
      this.targetEnvironmentVersion,
      this.host.generateEffectOrder(this.trigger as never),
      this.description,
      context,
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
  ): ClientEffect<'sessionTriggeredEffect'> {
    return new ClientEffect(
      ClientEffect.DEFAULT_SESSION_PROPERTIES._id,
      target.name,
      target._id,
      target.environment._id,
      target.environment.version,
      mission.generateEffectOrder(trigger),
      ClientEffect.DEFAULT_SESSION_PROPERTIES.description,
      {
        type: 'sessionTriggeredEffect',
        trigger,
        get sourceAction() {
          return null
        },
        get sourceNode() {
          return null
        },
        get sourceForce() {
          return null
        },
        sourceMission: mission,
        get host() {
          return this.sourceMission
        },
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
  ): ClientEffect<'executionTriggeredEffect'> {
    return new ClientEffect(
      ClientEffect.DEFAULT_EXEC_PROPERTIES._id,
      target.name,
      target._id,
      target.environment._id,
      target.environment.version,
      action.generateEffectOrder(trigger),
      ClientEffect.DEFAULT_EXEC_PROPERTIES.description,
      {
        type: 'executionTriggeredEffect',
        trigger,
        sourceAction: action,
        get sourceNode() {
          return this.sourceAction.node
        },
        get sourceForce() {
          return this.sourceAction.force
        },
        get sourceMission() {
          return this.sourceAction.mission
        },
        get host() {
          return this.sourceAction
        },
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
  ): ClientEffect<'sessionTriggeredEffect'> {
    return new ClientEffect(
      json._id,
      json.name,
      json.targetId,
      json.environmentId,
      json.targetEnvironmentVersion,
      json.order,
      json.description,
      {
        type: 'sessionTriggeredEffect',
        trigger: json.trigger,
        get sourceAction() {
          return null
        },
        get sourceNode() {
          return null
        },
        get sourceForce() {
          return null
        },
        sourceMission,
        get host() {
          return sourceMission
        },
      },
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
  ): ClientEffect<'executionTriggeredEffect'> {
    return new ClientEffect(
      json._id,
      json.name,
      json.targetId,
      json.environmentId,
      json.targetEnvironmentVersion,
      json.order,
      json.description,
      {
        type: 'executionTriggeredEffect',
        trigger: json.trigger,
        sourceAction,
        get sourceNode() {
          return this.sourceAction.node
        },
        get sourceForce() {
          return this.sourceAction.force
        },
        get sourceMission() {
          return this.sourceAction.mission
        },
        get host() {
          return this.sourceAction
        },
      },
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
type TDuplicateEffectOptions<TType extends TEffectType> = {
  /**
   * @see {@link ClientEffect.context}
   */
  context?: TSelectEffectContext<TMetisClientComponents>[TType]
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
 * Client implementation of {@link TEffectContextSession}.
 */
export type TClientTriggerDataSession =
  TEffectContextSession<TMetisClientComponents>

/**
 * Client implementation of {@link TEffectContextExecution}.
 */
export type TClientTriggerDataExec =
  TEffectContextExecution<TMetisClientComponents>

/**
 * Client implementation of {@link TEffectHost}.
 */
export type TClientEffectHost<TType extends TEffectType = TEffectType> =
  TEffectHost<TMetisClientComponents, TType>
