import Effect, {
  TEffectContextExecution,
  TEffectContextSession,
  TEffectExecutionTriggered,
  TEffectExecutionTriggeredJson,
  TEffectSessionTriggered,
  TEffectSessionTriggeredJson,
  TEffectType,
} from 'metis/missions/effects'
import { TMetisServerComponents } from 'metis/server'
import ServerTargetEnvironment from 'metis/server/target-environments'
import { TTargetEnvExposedEffect } from 'metis/server/target-environments/context'
import ServerTarget from 'metis/server/target-environments/targets'
import ForceArg from 'metis/target-environments/args/mission-component/force-arg'
import NodeArg from 'metis/target-environments/args/mission-component/node-arg'
import { AnyObject } from 'metis/toolbox/objects'
import ServerMission from '..'
import ServerMissionAction from '../actions'

/**
 * Class representing an effect on the server-side that can be
 * applied to a target.
 */
export default class ServerEffect<
  TType extends TEffectType = TEffectType,
> extends Effect<TMetisServerComponents, TType> {
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
   * Extracts the necessary properties from the effect's arguments to be used as a reference
   * in a target environment.
   * @param args The arguments to extract the necessary properties from.
   * @returns The modified arguments.
   */
  public argsToTargetEnvContext(args: AnyObject): AnyObject {
    // Copy the arguments.
    let argsCopy = { ...args }

    Object.entries(argsCopy).forEach(([key, value]) => {
      if (value[ForceArg.FORCE_NAME] !== undefined) {
        delete argsCopy[key][ForceArg.FORCE_NAME]
      }
      if (value[NodeArg.NODE_NAME] !== undefined) {
        delete argsCopy[key][NodeArg.NODE_NAME]
      }
    })

    // Return the modified arguments.
    return argsCopy
  }

  /**
   * Extracts the necessary properties from the effect to be used as a reference
   * in a target environment.
   * @returns The effect's necessary properties.
   */
  public toTargetEnvContext(): TTargetEnvExposedEffect {
    return {
      _id: this._id,
      name: this.name,
      type: this.type,
      trigger: this.trigger,
      args: this.argsToTargetEnvContext(this.args),
    }
  }

  /**
   * Sanitizes the arguments for the effect.
   * todo: This is not currently used. Reevaluate if this is needed in the future.
   */
  public sanitizeArgs(): void {
    // If the target is not set, throw an error.
    if (!this.target) {
      throw new Error(
        `The effect ({ _id: "${this._id}", name: "${this.name}" }) does not have a target. ` +
          `This is likely because the target doesn't exist within any of the target environments stored in the registry.`,
      )
    }
    // The sanitized arguments.
    let sanitizedArgs = this.args

    // Loop through the target's arguments.
    for (let arg of this.target.args) {
      // Check if all the dependencies for the argument are met.
      let allDependenciesMet: boolean = this.allDependenciesMet(
        arg.dependencies,
      )

      // If any of the dependencies are not met and the argument is in the effect's arguments...
      if (!allDependenciesMet && arg._id in this.args) {
        // ...and the argument's type is a boolean or the argument is required, then remove the
        // argument.
        // *** Note: A boolean argument is always required because it's value
        // *** is always defined.
        if (arg.type === 'boolean' || arg.required) {
          delete sanitizedArgs[arg._id]
        }
      }
    }

    // Set the sanitized arguments.
    this.args = sanitizedArgs
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
      ServerEffect.DEFAULT_SESSION_PROPERTIES.description,
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
      ServerEffect.DEFAULT_SESSION_PROPERTIES.args,
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
      ServerEffect.DEFAULT_EXEC_PROPERTIES.description,
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
      ServerEffect.DEFAULT_EXEC_PROPERTIES.args,
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
          return this.sourceMission
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
    sourceAction: ServerMissionAction,
  ): ServerEffect<'executionTriggeredEffect'> {
    return new ServerEffect(
      json._id,
      json.name,
      json.targetId,
      json.environmentId,
      json.targetEnvironmentVersion,
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

/* ------------------------------ SERVER EFFECT TYPES ------------------------------ */

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
