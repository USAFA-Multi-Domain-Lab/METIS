import type { TMissionOutlineItem } from '@client/components/pages/missions/structures/MissionOutline'
import type { TMetisClientComponents } from '@client/index'
import type { ClientTarget } from '@client/target-environments/ClientTarget'
import { ClientTargetEnvironment } from '@client/target-environments/ClientTargetEnvironment'
import { ClientTargetArgument } from '@client/target-environments/arguments/ClientTargetArgument'
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
import type { TTargetArgumentJson } from '@shared/target-environments/arguments/TargetArgument'

import { JsonSerializableArray } from '@shared/toolbox/arrays/JsonSerializableArray'
import type { ClientMission } from '../ClientMission'
import type { ClientMissionAction } from '../actions/ClientMissionAction'

/**
 * Class representing an effect on the client-side that can be
 * applied to a target.
 */
export class ClientEffect<TType extends TEffectType = TEffectType>
  extends Effect<TMetisClientComponents, TType>
  implements TMissionOutlineItem
{
  // Implemented
  public readonly outlineIcon: TMetisIcon = 'waves'

  // Implemented
  public expandedInOutline: boolean = false

  // Implemented
  public get outlineChildren(): TMissionOutlineItem[] {
    return []
  }

  // Implemented
  public get outlineParent(): TMissionOutlineItem | null {
    return this.superComponent
  }

  /**
   * A promise that resolves when the current migration in progress
   * is complete. A current migration will only be present if
   * {@link $migrateArguments} has been called and has not yet completed.
   */
  public migrationPromise: Promise<void> | null = null

  /**
   * Tracks whether a migration is currently in progress for this
   * effect, preventing multiple simultaneous migrations and allowing
   * the UI to respond accordingly.
   */
  public get migrationInProgress(): boolean {
    return this.migrationPromise !== null
  }

  // Implemented
  protected parseArguments(
    data: TTargetArgumentJson[],
  ): JsonSerializableArray<ClientTargetArgument> {
    let targetArguments = JsonSerializableArray.fromJson(
      data,
      (datum: TTargetArgumentJson) =>
        ClientTargetArgument.fromJson(datum, this),
    )

    // Extra step on the client to keep arguments in sync with the target's
    // current parameters. Skip if the effect is outdated or the target cannot
    // be resolved, since a migration will supply the correct arguments instead.
    if (this.target && !this.outdated) {
      for (let parameter of this.target.parameters) {
        // Add a new default argument if there is no argument corresponding
        // to the parameter in type. This could cause duplicate arguments. However,
        // arguments with mismatching types will be filtered out in the UI.
        let foundWithMatchingType = targetArguments.find(
          (arg) =>
            arg.parameterId === parameter._id && arg.type === parameter.type,
        )
        if (!foundWithMatchingType) {
          targetArguments.push(
            ClientTargetArgument.createDefault(parameter, this),
          )
        }
      }
    }

    return targetArguments
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

    let duplicatedEffect = new ClientEffect<TType>(
      ClientEffect.DEFAULT_EXEC_PROPERTIES._id,
      name,
      this.targetId,
      this.environmentId,
      this.targetEnvironmentVersion,
      this.host.generateEffectOrder(this.trigger as never),
      this.description,
      context,
      [],
      localKey,
    )

    // Duplicate the arguments.
    duplicatedEffect.arguments = new JsonSerializableArray(
      ...this.arguments.map((arg) => arg.duplicate(duplicatedEffect)),
    )

    return duplicatedEffect
  }

  /**
   * Migrates the effect's arguments to be compatible with the current
   * version of the target environment. This will call the migration
   * API endpoint and update the effect's arguments with the migrated
   * data returned from the server.
   * @resolves After the migration is complete and the effect's arguments have been updated.
   * @rejects If there was an error during the migration process.
   */
  public $migrateArguments(): Promise<void> {
    this.migrationPromise = new Promise(async (resolve, reject) => {
      try {
        let results =
          await ClientTargetEnvironment.$migrateTargetArguments(this)
        // Store the migrated data in the component.
        this.targetEnvironmentVersion = results.version
        this.arguments = this.parseArguments(results.data)
        this.sortArguments()
        this.mission.issueRegistry.trigger('effect-updated', this)
        for (let argument of this.arguments) {
          argument.mission.issueRegistry.trigger('effect-updated', argument)
        }
        resolve()
      } catch (error) {
        reject(error)
      } finally {
        this.migrationPromise = null
      }
    })
    return this.migrationPromise
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
    let effect = new ClientEffect<'sessionTriggeredEffect'>(
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
      [],
      mission.generateEffectKey(),
    )
    return effect
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
    let effect = new ClientEffect<'executionTriggeredEffect'>(
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
      ClientEffect.DEFAULT_EXEC_PROPERTIES.arguments,
      action.generateEffectKey(),
    )
    return effect
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
      json.arguments,
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
