import { ServerTargetArgument } from '@server/target-environments/arguments/ServerTargetArgument'
import type { TTargetEnvExposedEffect } from '@server/target-environments/context/TargetEnvContext'
import type { ServerTarget } from '@server/target-environments/ServerTarget'
import { ServerTargetEnvironment } from '@server/target-environments/ServerTargetEnvironment'
import type { TMigratableEffect } from '@server/target-environments/TargetMigration'
import { TargetMigration } from '@server/target-environments/TargetMigration'
import type {
  TEffectContextExecution,
  TEffectContextSession,
  TEffectExecutionTriggered,
  TEffectExecutionTriggeredJson,
  TEffectSessionTriggered,
  TEffectSessionTriggeredJson,
  TEffectType,
} from '@shared/missions/effects/Effect'
import { Effect } from '@shared/missions/effects/Effect'
import type { TTargetArgumentJson } from '@shared/target-environments/arguments/TargetArgument'
import { JsonSerializableArray } from '@shared/toolbox/arrays/JsonSerializableArray'
import type { ServerMissionAction } from '../actions/ServerMissionAction'
import type { ServerMission } from '../ServerMission'

/**
 * Class representing an effect on the server-side that can be
 * applied to a target.
 */
export class ServerEffect<
  TType extends TEffectType = TEffectType,
> extends Effect<TMetisServerComponents, TType> {
  // Implemented
  protected parseArguments(
    data: TTargetArgumentJson[],
  ): JsonSerializableArray<ServerTargetArgument> {
    return JsonSerializableArray.fromJson(data, (datum: TTargetArgumentJson) =>
      ServerTargetArgument.fromJson(datum, this),
    )
  }

  // Implemented
  protected determineTarget(
    targetId: string,
    environmentId: string,
  ): ServerTarget | null {
    if (environmentId === ServerEffect.ENVIRONMENT_ID_INFER) {
      return ServerTargetEnvironment.REGISTRY.inferTarget(targetId) ?? null
    } else {
      return (
        ServerTargetEnvironment.REGISTRY.getTarget(targetId, environmentId) ??
        null
      )
    }
  }

  /**
   * @returns The properties from the effect that are
   * safe to expose in target-environment code.
   */
  public toTargetEnvContext(): TTargetEnvExposedEffect<TType> {
    const self = this
    return {
      _id: self._id,
      localKey: self.localKey,
      name: self.name,
      type: self.type,
      trigger: self.trigger,
      description: self.description,
      order: self.order,
      get mission() {
        return self.mission.toTargetEnvContext()
      },
      get host() {
        return self.host.toTargetEnvContext()
      },
      get sourceForce() {
        return self.sourceForce ? self.sourceForce.toTargetEnvContext() : null
      },
      get sourceNode() {
        return self.sourceNode ? self.sourceNode.toTargetEnvContext() : null
      },
      get sourceAction() {
        return self.sourceAction ? self.sourceAction.toTargetEnvContext() : null
      },
      get target() {
        return self.target ? self.target.toTargetEnvContext() : null
      },
      get environment() {
        return self.environment ? self.environment.toTargetEnvContext() : null
      },
      get arguments() {
        return self.arguments
          .filter((argument) => argument.dependenciesMet)
          .map((argument) => argument.toTargetEnvContext())
      },
    }
  }

  /**
   * Generates an effect object which can be used
   * to perform a migration between versions via
   * a {@link TargetMigration}.
   */
  public toMigratable(): TMigratableEffect {
    let self = this

    let migratableEffect: TMigratableEffect = {
      _id: self._id,
      localKey: self.localKey,
      name: self.name,
      type: self.type,
      trigger: self.trigger,
      description: self.description,
      order: self.order,
      arguments: self.arguments.map((arg) => arg.json),
      versionCursor: this.targetEnvironmentVersion,
      get mission() {
        return self.mission.toTargetEnvContext()
      },
      get host() {
        return self.host.toTargetEnvContext()
      },
      get sourceForce() {
        return self.sourceForce ? self.sourceForce.toTargetEnvContext() : null
      },
      get sourceNode() {
        return self.sourceNode ? self.sourceNode.toTargetEnvContext() : null
      },
      get sourceAction() {
        return self.sourceAction ? self.sourceAction.toTargetEnvContext() : null
      },
      get target() {
        return self.target ? self.target.toTargetEnvContext() : null
      },
      get environment() {
        return self.environment ? self.environment.toTargetEnvContext() : null
      },
      get result() {
        return {
          version: this.versionCursor,
          data: structuredClone(this.arguments),
        }
      },
    }

    return migratableEffect
  }

  /**
   * @param target The target for the new effect.
   * @param mission The mission that will host the effect.
   * @returns A new effect with the provided target for
   * a session, with session-lifecycle trigger,
   * populated with the corresponding mission and target
   * information. Non-mission and non-target specific values
   * will be populated with {@link ServerEffect.DEFAULT_SESSION_PROPERTIES}.
   */
  public static createBlankSessionEffect(
    target: ServerTarget,
    mission: ServerMission,
    trigger: TEffectSessionTriggered,
  ): ServerEffect<'sessionTriggeredEffect'> {
    return new ServerEffect(
      ServerEffect.DEFAULT_SESSION_PROPERTIES._id,
      ServerEffect.DEFAULT_SESSION_PROPERTIES.name,
      target._id,
      target.environment._id,
      target.environment.version,
      mission.generateEffectOrder(trigger),
      ServerEffect.DEFAULT_SESSION_PROPERTIES.description,
      Effect.buildSessionContext<TMetisServerComponents>(trigger, mission),
      ServerEffect.DEFAULT_SESSION_PROPERTIES.arguments,
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
   * will be populated with {@link ServerEffect.DEFAULT_EXEC_PROPERTIES}.
   */
  public static createBlankExecutionEffect(
    target: ServerTarget,
    action: ServerMissionAction,
    trigger: TEffectExecutionTriggered,
  ): ServerEffect<'executionTriggeredEffect'> {
    return new ServerEffect(
      ServerEffect.DEFAULT_EXEC_PROPERTIES._id,
      ServerEffect.DEFAULT_EXEC_PROPERTIES.name,
      target._id,
      target.environment._id,
      target.environment.version,
      action.generateEffectOrder(trigger),
      ServerEffect.DEFAULT_EXEC_PROPERTIES.description,
      Effect.buildExecutionContext<TMetisServerComponents>(trigger, action),
      ServerEffect.DEFAULT_EXEC_PROPERTIES.arguments,
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
    sourceMission: ServerMission,
  ): ServerEffect<'sessionTriggeredEffect'> {
    return new ServerEffect(
      json._id,
      json.name,
      json.targetId,
      json.environmentId,
      json.targetEnvironmentVersion,
      json.order,
      json.description,
      Effect.buildSessionContext<TMetisServerComponents>(
        json.trigger,
        sourceMission,
      ),
      json.arguments,
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
    sourceAction: ServerMissionAction,
  ): ServerEffect<'executionTriggeredEffect'> {
    return new ServerEffect(
      json._id,
      json.name,
      json.targetId,
      json.environmentId,
      json.targetEnvironmentVersion,
      json.order,
      json.description,
      Effect.buildExecutionContext<TMetisServerComponents>(
        json.trigger,
        sourceAction,
      ),
      json.arguments,
      json.localKey,
    )
  }
}

/* -- TYPES -- */

/**
 * The status on whether the target for the effect has been populated.
 */
export type TServerTargetStatus =
  | 'Populated'
  | 'Populating'
  | 'Not Populated'
  | 'Error'

/**
 * Server implementation of {@link TEffectContextSession}.
 */
export type TServerTriggerDataSession =
  TEffectContextSession<TMetisServerComponents>

/**
 * Server implementation of {@link TEffectContextExecution}.
 */
export type TServerTriggerDataExec =
  TEffectContextExecution<TMetisServerComponents>
