import type { TTargetArgumentJson } from '@shared/target-environments/arguments/TargetArgument'
import type { JsonSerializableArray } from '@shared/toolbox/arrays/JsonSerializableArray'
import { BooleanToolbox } from '@shared/toolbox/booleans/BooleanToolbox'
import { StringToolbox } from '../../toolbox/strings/StringToolbox'
import { VersionToolbox } from '../../toolbox/strings/VersionToolbox'
import { MissionComponent } from '../MissionComponent'
import type { MissionComponentIssueRegistry } from '../MissionComponentIssueRegistry'

/**
 * An effect that can be applied to a target.
 */
export abstract class Effect<
  T extends TMetisBaseComponents = TMetisBaseComponents,
  TType extends TEffectType = TEffectType,
> extends MissionComponent<T, Effect<T, TType>> {
  /**
   * The type of effect in use. Defines data structure for the effect.
   */
  public get type(): TType {
    return this.context.type as TType
  }

  /**
   * The mission to which the effect belongs.
   */
  public get mission(): TSelectEffectContext<T>[TType]['sourceMission'] {
    return this.context.sourceMission
  }

  /**
   * The force which either directly or indirectly
   * hosts the effect.
   * @note If `null`, then the effect is not hosted
   * by any force.
   */
  public get sourceForce(): TSelectEffectContext<T>[TType]['sourceForce'] {
    return this.context.sourceForce
  }

  /**
   * The node which either directly or indirectly
   * hosts the effect.
   * @note If `null`, then the effect is not hosted
   * by any node.
   */
  public get sourceNode(): TSelectEffectContext<T>[TType]['sourceNode'] {
    return this.context.sourceNode
  }

  /**
   * The action which directly or indirectly
   * hosts the effect.
   * @note If `null`, then the effect is not hosted
   * by any action.
   */
  public get sourceAction(): TSelectEffectContext<T>[TType]['sourceAction'] {
    return this.context.sourceAction
  }

  /**
   * TypeScript does not understand safeties placed
   * in the system and types too strictly when it comes
   * to effects. This normalizes the effect to only be of
   * types that are actually useful in the system, preventing
   * headaches from lint errors.
   */
  public normalize():
    | T['executionTriggeredEffect']
    | T['sessionTriggeredEffect'] {
    switch (this.type) {
      case 'executionTriggeredEffect':
        return this as unknown as T['executionTriggeredEffect']
      case 'sessionTriggeredEffect':
        return this as unknown as T['sessionTriggeredEffect']
      default:
        throw new Error(
          `Unsupported effect type: "${this.type}". Cannot normalize effect with ID "${this._id}".`,
        )
    }
  }

  /**
   * The component that directly hosts the effect.
   */
  public get host(): TSelectEffectContext<T>[TType]['host'] {
    return this.context.host
  }

  /**
   * Additional data for the effect specific to the
   * type used.
   */
  protected context: TSelectEffectContext<T>[TType]

  /**
   * The environment in which the target exists.
   */
  public get environment(): T['targetEnv'] | null {
    return this.target?.environment ?? null
  }

  /**
   * The ID of the environment in which the
   * target exists.
   */
  public readonly environmentId: string

  /**
   * The target to which the effect will be applied.
   */
  public target: T['target'] | null

  /**
   * The ID of the target for the effect.
   */
  public readonly targetId: string

  /**
   * The version of the corresponding target environment
   * for which this effect is compatible. If the version
   * of the target environment does not match this version,
   * a migration may be required to apply the effect.
   */
  public targetEnvironmentVersion: string

  // Implemented
  public get superComponent(): TSelectEffectContext<T>[TType]['host'] {
    return this.host
  }

  // Implemented
  public get source(): TSelectEffectContext<T>[TType]['host'] {
    return this.host
  }

  // Implemented
  public get subComponents(): T['targetArgument'][] {
    return [...this.arguments]
  }

  // Implemented
  public get sourceList(): T[TType][] {
    return this.host.effects as T[TType][]
  }

  // Implemented
  public get path(): [...MissionComponent<any, any>[], this] {
    // Dynamically construct the path based on
    // the trigger data.
    switch (this.context.trigger) {
      case 'session-setup':
      case 'session-start':
      case 'session-teardown':
        return [this.mission, this]
      case 'execution-initiation':
      case 'execution-success':
      case 'execution-failure':
        let { sourceAction } = this.context
        return [
          this.mission,
          sourceAction.force,
          sourceAction.node,
          sourceAction,
          this,
        ]
    }
  }

  /**
   * The impetus for the effect. Once the give event occurs
   * on an action, this effect will be enacted.
   */
  public get trigger(): TSelectEffectContext<T>[TType]['trigger'] {
    return this.context.trigger
  }
  public set trigger(value: TSelectEffectContext<T>[TType]['trigger']) {
    this.context.trigger = value
  }

  /**
   * A numeric value which determines the order in which
   * the effect will be applied relative to other effects.
   */
  public order: number

  /**
   * Describes the purpose of the effect.
   */
  public description: string

  /**
   * The arguments to pass to the script in the
   * target that will enact the effect.
   */
  public arguments: JsonSerializableArray<T['targetArgument']>

  /**
   * A key for the effect, used to identify it within the action.
   */
  public localKey: string

  /**
   * Whether the effect is missing its target, which is
   * necessary for the effect to be enacted.
   */
  public get missingTarget(): boolean {
    return !this.target
  }

  /**
   * `true` if the effect predates the tracking of `environmentId`
   * within effects and the effect target-environment cannot be
   * inferred.
   */
  public get failedEnvironmentInference(): boolean {
    return this.environmentId === Effect.LEGACY_INFER_ENV_ID
  }

  /**
   * Whether the given is outdated given the current
   * version of the target environment.
   */
  public get outdated(): boolean {
    let { target } = this

    if (!target) return false

    let latestMigratableVersion = target.latestMigratableVersion

    // If there is no latest migratable version,
    // the effect is not outdated.
    if (latestMigratableVersion === undefined) return false

    // Return whether the target-environment version
    // of the effect is earlier than the latest
    // migratable version.
    let result = VersionToolbox.compareVersions(
      this.targetEnvironmentVersion,
      latestMigratableVersion,
    )
    return result === 'earlier'
  }

  /**
   * Marks the target arguments of this effect as locked
   * if the effect is incompatible with the current version
   * of the target environment or if the environment cannot
   * be resolved.
   */
  public get targetArgumentsLocked(): boolean {
    return (
      this.missingTarget || this.failedEnvironmentInference || this.outdated
    )
  }

  /**
   * Whether this effect should be skipped rather than run during a
   * session. An effect is skipped when it carries an unresolved issue of
   * its own (e.g. a missing target or an outdated version) or when any of
   * its arguments carries an unresolved issue (e.g. a dropdown value that
   * no longer matches any option).
   */
  public get shouldSkip(): boolean {
    return (
      this.hasIssues || this.arguments.some((argument) => argument.hasIssues)
    )
  }

  /**
   * @param data Additional information for the effect.
   */
  protected constructor(
    _id: string,
    name: string,
    targetId: string,
    environmentId: string,
    targetEnvironmentVersion: string,
    order: number,
    description: string,
    context: TSelectEffectContext<T>[TType],
    args: TTargetArgumentJson[],
    localKey: string,
  ) {
    super(_id, name, false)

    // Determine the target based on the target ID
    // and environment ID provided.
    this.target = this.determineTarget(targetId, environmentId)

    this.targetId = targetId
    this.environmentId = environmentId
    this.targetEnvironmentVersion = targetEnvironmentVersion
    this.context = context
    this.order = order
    this.description = description
    this.localKey = localKey
    this.arguments = this.parseArguments(args)
    this.sortArguments()
  }

  /**
   * Determines the target for the effect.
   * @param targetId The ID of the target.
   * @param environmentId The ID of the environment.
   * @returns The target for the effect.
   */
  protected abstract determineTarget(
    targetId: string,
    environmentId: string,
  ): T['target'] | null

  /**
   * Parses raw argument JSON into hydrated `TargetArgument` instances.
   * @param data The raw argument JSON to parse.
   * @returns The hydrated arguments array.
   */
  protected abstract parseArguments(
    data: TTargetArgumentJson[],
  ): JsonSerializableArray<T['targetArgument']>

  /**
   * Re-orders {@link arguments} to match the declaration order of parameters
   * on the current target. Arguments whose `parameterId` is not found in the
   * target are sorted to the end. A no-op if {@link target} is absent.
   */
  public sortArguments(): void {
    if (!this.target) return
    let parameterIds = this.target.parameters.map((param) => param._id)
    this.arguments.sort(
      (a, b) =>
        parameterIds.indexOf(a.parameterId) -
        parameterIds.indexOf(b.parameterId),
    )
  }

  /**
   * @returns A JSON representation of the Effect.
   */
  public toJson(): TEffectJson {
    return {
      _id: this._id,
      targetId: this.targetId,
      environmentId: this.environmentId,
      targetEnvironmentVersion: this.targetEnvironmentVersion,
      trigger: this.trigger,
      order: this.order,
      name: this.name,
      description: this.description,
      arguments: this.arguments.map((arg) => arg.json),
      localKey: this.localKey,
    }
  }

  /**
   * @returns A JSON representation of the Effect,
   * as {@link TEffectSessionTriggeredJson}.
   * @throws If the effect is not triggered by a
   * session-lifecycle event.
   */
  public toSessionTriggeredJson(): TEffectSessionTriggeredJson {
    if (
      this.trigger === 'execution-initiation' ||
      this.trigger === 'execution-success' ||
      this.trigger === 'execution-failure'
    ) {
      throw new Error(
        'Cannot call `toSessionTriggeredJson` for a non-session-triggered effect.',
      )
    }

    let sessionTriggeredJson: TEffectSessionTriggeredJson = {
      ...this.toJson(),
      trigger: this.trigger,
    }

    return sessionTriggeredJson
  }

  /**
   * @returns A JSON representation of the Effect,
   * as {@link TEffectExecutionTriggeredJson}.
   * @throws If the effect is not triggered by an
   * action-execution-lifecycle event.
   */
  public toExecutionTriggeredJson(): TEffectExecutionTriggeredJson {
    if (
      this.trigger === 'session-setup' ||
      this.trigger === 'session-start' ||
      this.trigger === 'session-teardown'
    ) {
      throw new Error(
        'Cannot call `toExecutionTriggeredJson` for a non-execution-triggered effect.',
      )
    }

    let executionTriggeredJson: TEffectExecutionTriggeredJson = {
      ...this.toJson(),
      trigger: this.trigger,
    }

    return executionTriggeredJson
  }

  /**
   * Gets the argument associated with a specific parameter ID.
   * @param parameterId The ID of the parameter of the associated argument.
   * @returns The argument if found, otherwise undefined.
   */
  public getArgumentByParameterId = (
    parameterId: string,
  ): T['targetArgument'] | undefined => {
    return this.arguments.find((arg) => arg.parameterId === parameterId)
  }

  /**
   * Registers issue checkers for all {@link Effect} instances
   * with the provided registry.
   * @param registry The registry to register checkers with.
   */
  public static registerIssueCheckers(
    registry: MissionComponentIssueRegistry,
  ): void {
    registry.check({
      key: Effect.ISSUE_KEY_MISSING_TARGET,
      message: () =>
        `The corresponding target could not be found. Please reinstall/repair the corresponding target environment or delete this effect.`,
      what: [Effect],
      if: (effect) => effect.missingTarget,
    })
    registry.check({
      key: Effect.ISSUE_KEY_LEGACY_INFER,
      message: () =>
        `The corresponding target could not be found. Please reinstall/repair the corresponding target environment or delete this effect.`,
      what: [Effect],
      if: (effect) =>
        BooleanToolbox.onlyLast(
          effect.missingTarget,
          effect.failedEnvironmentInference,
        ),
    })
    registry.check({
      key: Effect.ISSUE_KEY_OUTDATED,
      message: () =>
        'Update required to be made compatible with the current version of the target environment.',
      what: [Effect],
      when: ['initialization', 'effect-updated'],
      if: (effect) =>
        BooleanToolbox.onlyLast(
          effect.missingTarget,
          effect.failedEnvironmentInference,
          effect.outdated,
        ),
    })
  }

  /**
   * The maximum length allowed for an effect's name.
   */
  public static readonly MAX_NAME_LENGTH: number = 175

  /**
   * A value for `environmentId` that indicates the
   * target should be inferred based on the `targetId`
   * alone.
   */
  public static readonly ENVIRONMENT_ID_INFER: string = 'INFER'

  /**
   * Legacy environment ID used in build_000038 that
   * indicates missing target environment reference.
   */
  public static readonly LEGACY_INFER_ENV_ID: string = 'infer-for-build_000038'

  /**
   * Key used to index an issue when an effect is missing
   * its target.
   */
  public static readonly ISSUE_KEY_MISSING_TARGET = 'missing-target'

  /**
   * Key used to index an issue when an effect predates the
   * tracking of `environmentId` and the target environment cannot
   * be inferred.
   */
  public static readonly ISSUE_KEY_LEGACY_INFER = 'legacy-infer-env'

  /**
   * Key used to index an issue when an effect is outdated.
   */
  public static readonly ISSUE_KEY_OUTDATED = 'outdated'

  /**
   * Default properties set when creating a new
   * session-triggered effect.
   */
  public static get DEFAULT_SESSION_PROPERTIES(): TEffectDefaultJson<TEffectSessionTriggered> {
    return {
      _id: StringToolbox.generateRandomId(),
      trigger: 'session-setup',
      order: 0,
      name: 'New Effect',
      description: '',
      arguments: [],
    }
  }

  /**
   * Default properties set when creating a new
   * execution-triggered effect.
   */
  public static get DEFAULT_EXEC_PROPERTIES(): TEffectDefaultJson<TEffectExecutionTriggered> {
    return {
      ...this.DEFAULT_SESSION_PROPERTIES,
      trigger: 'execution-success',
    }
  }

  /**
   * Available triggers for an effect.
   */
  public static get TRIGGERS(): TEffectTrigger[] {
    return [
      'session-setup',
      'session-start',
      'session-teardown',
      'execution-initiation',
      'execution-success',
      'execution-failure',
    ]
  }
}

/* -- TYPES -- */

/**
 * Effect triggers that occur as a result of
 * a session-lifecycle event.
 */
export type TEffectSessionTriggered =
  | 'session-setup'
  | 'session-start'
  | 'session-teardown'

/**
 * Effect triggers that occur as a result of
 * an action-execution-lifecycle event.
 */
export type TEffectExecutionTriggered =
  | 'execution-initiation'
  | 'execution-success'
  | 'execution-failure'

/**
 * Valid triggers for an effect.
 */
export type TEffectTrigger = TEffectSessionTriggered | TEffectExecutionTriggered

/**
 * Map of effect-types to their valid triggers.
 */
export type TEffectTriggerGroups = {
  sessionTriggered: TEffectSessionTriggered
  executionTriggered: TEffectExecutionTriggered
}

/**
 * Data needed to create an effect that is triggered
 * by a session-lifecycle event.
 */
export interface TEffectContextSession<T extends TMetisBaseComponents> {
  /**
   * The type of effect in use. Defines data structure
   * for the effect.
   */
  type: 'sessionTriggeredEffect'
  /**
   * The trigger that causes the effect to be applied.
   */
  trigger: TEffectSessionTriggered
  /**
   * The action hosting the effect. This will
   * trigger the effect when the action's
   * is executed and the correct lifecycle event
   * occurs.
   */
  get sourceAction(): null
  /**
   * The node hosting the effect.
   */
  get sourceNode(): null
  /**
   * The force hosting the effect.
   */
  get sourceForce(): null
  /**
   * The mission hosting the effect.
   */
  sourceMission: T['mission']
  /**
   * Directly houses the effect in a list.
   */
  get host(): T['mission']
}

/**
 * Data needed to create an effect that is triggered
 * by an action-execution-lifecycle event.
 */
export interface TEffectContextExecution<T extends TMetisBaseComponents> {
  /**
   * The type of effect in use. Defines data structure
   * for the effect.
   */
  type: 'executionTriggeredEffect'
  /**
   * The trigger that causes the effect to be applied.
   */
  trigger: TEffectExecutionTriggered
  /**
   * The action hosting the effect.
   */
  sourceAction: T['action']
  /**
   * The node hosting the effect.
   */
  get sourceNode(): T['node']
  /**
   * The force hosting the effect.
   */
  get sourceForce(): T['force']
  /**
   * The mission hosting the effect.
   */
  get sourceMission(): T['mission']
  /**
   * Directly houses the effect in a list.
   */
  get host(): T['action']
}

/**
 * Additional context used for an effect, specific
 * to the effect's trigger.
 */
export type TEffectContext<T extends TMetisBaseComponents> =
  | TEffectContextSession<T>
  | TEffectContextExecution<T>

/**
 * The type of effect in use. Defines data structure
 * for the effect.
 */
export type TEffectType = TEffectContext<any>['type']

/**
 * Allows a trigger-data type to be selected from
 * the effect type.
 */
export type TSelectEffectContext<T extends TMetisBaseComponents> = {
  sessionTriggeredEffect: TEffectContextSession<T>
  executionTriggeredEffect: TEffectContextExecution<T>
}

/**
 * Extracts all the properties of an `Effect` that are
 * needed for the JSON representation of the effect.
 */
const JSON_PROPERTIES_RAW = {
  direct: [
    '_id',
    'name',
    'description',
    'targetId',
    'environmentId',
    'targetEnvironmentVersion',
    'trigger',
    'order',
    'localKey',
  ],
  indirect: [
    {
      arguments: [] as TTargetArgumentJson[],
    },
  ],
} as const

/**
 * All of the property types of an `Effect` that are
 * converted directly for the JSON representation of the effect.
 * @note The types for each property are the same as the types
 * used in the `Effect` class.
 */
export type TEffectJsonDirect = (typeof JSON_PROPERTIES_RAW)['direct'][number]
/**
 * All of the property types of an `Effect` that are
 * converted indirectly for the JSON representation of the effect.
 * @note The types for each property have been converted to a
 * different type than the types used for those properties in the
 * `Effect` class.
 */
export type TEffectJsonIndirect =
  (typeof JSON_PROPERTIES_RAW)['indirect'][number]

/**
 * Plain JSON representation of an `Effect` object.
 */
export type TEffectJson = TCreateJsonType<
  Effect,
  TEffectJsonDirect,
  TEffectJsonIndirect
>

/**
 * Plain JSON representation of an `Effect` object
 * that is triggered by a session-lifecycle event.
 */
export interface TEffectExecutionTriggeredJson extends Omit<
  TEffectJson,
  'trigger'
> {
  trigger: TEffectExecutionTriggered
}

/**
 * Plain JSON representation of an `Effect` object
 * that is triggered by an action-execution-lifecycle event.
 */
export interface TEffectSessionTriggeredJson extends Omit<
  TEffectJson,
  'trigger'
> {
  trigger: TEffectSessionTriggered
}

/**
 * The default properties for an `Effect` object.
 * @inheritdoc TEffectJson
 */
export interface TEffectDefaultJson<
  TTrigger extends TEffectTrigger,
> extends Required<
  Omit<
    TEffectJson,
    | 'trigger'
    | 'localKey'
    | 'targetId'
    | 'environmentId'
    | 'targetEnvironmentVersion'
  >
> {
  trigger: TTrigger
}

/**
 * A mission component that hosts a list of effects.
 */
export interface TEffectHost<
  T extends TMetisBaseComponents,
  TType extends TEffectType,
> extends MissionComponent<T> {
  /**
   * The effects hosted by the component.
   */
  effects: T[TType][]
  /**
   * Used to identify the type of effects hosted by the component.
   */
  effectType: TType
  /**
   * Triggers that are valid for effects hosted by the component.
   */
  get validTriggers(): T[TType]['trigger'][]
  /**
   * Creates a new effect and adds it to the list of effects
   * hosted by the component.
   * @param target The target of the effect.
   * @param trigger What causes the effect to be enacted.
   * @returns The new effect.
   */
  createEffect: (target: T['target'], trigger: T[TType]['trigger']) => T[TType]
  /**
   * Generates a new key for an effect which
   * is unique among all effects hosted by the component.
   * @returns The new key for an effect.
   */
  generateEffectKey(): string
  /**
   * Generates a new order number for a new effect
   * with the given trigger. This will be the
   * highest existing order number for this trigger
   * plus one.
   * @param trigger The trigger to generate the order
   * number for.
   * @returns The new order number for a new effect with
   * the given trigger.
   */
  generateEffectOrder(trigger: T[TType]['trigger']): number
}

/**
 * Resulting data produced by the migration of
 * an {@link Effect}.
 */
export interface TEffectMigrationResult {
  /**
   * The version to which the effect was migrated.
   */
  version: string
  /**
   * The resulting data produced from the migration.
   */
  data: TTargetArgumentJson[]
}
