import type { TTargetArgumentJson } from '@shared/target-environments/arguments/TargetArgument'
import type { TTargetParameter } from '../../target-environments/parameters/TargetParameter'
import type { TargetDependency } from '../../target-environments/targets/TargetDependency'
import type { TAnyObject } from '../../toolbox/objects/ObjectToolbox'
import { StringToolbox } from '../../toolbox/strings/StringToolbox'
import { VersionToolbox } from '../../toolbox/strings/VersionToolbox'
import {
  MissionComponent,
  type TMissionComponentIssue,
} from '../MissionComponent'

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

  // Implemented
  protected get additionalIssues(): TMissionComponentIssue[] {
    const { environment, target } = this

    // Construct issue objects for the given messages.
    const constructIssues = (...messages: string[]): TMissionComponentIssue[] =>
      messages.map((message) => ({ type: 'general', component: this, message }))

    // If the effect's target or target environment cannot be found, then the effect has issues.
    // *** Note: An effect grabs the target environment from the target after the
    // *** target is populated. So, if the target cannot be found, the target will
    // *** be set null which means the target environment will be null also.
    // *** Also, if a target-environment cannot be found, then obviously the target
    // *** within that environment cannot be found either.
    if (!environment || !target) {
      return constructIssues(
        `The effect, "${this.name}", has a target or a target environment that couldn't be found. ` +
          `Please contact an administrator on how to resolve this conflict, or delete the effect and create a new one.`,
      )
    }

    // If the effect's target environment version doesn't match
    // the current version, then the effect has issues.
    if (this.outdated) {
      return [
        {
          type: 'outdated',
          component: this,
          message:
            `The effect, "${this.name}", is incompatible with the current version of the target environment, "${environment.name}". ` +
            `This effect must be updated to be made compatible. ` +
            `Please click to resolve this.`,
        },
      ]
    }

    // Check the effect's arguments against the target's parameters.
    let argIssues = this.checkTargetArguments(target)
    if (argIssues.length) return constructIssues(...argIssues)

    // Check to see if there are any missing arguments.
    let missingArg = this.getFirstUnfulfilledParameter()
    if (missingArg) {
      return constructIssues(
        `The required argument "${missingArg.name}" within the effect "${this.name}" is missing.`,
      )
    }

    if (this.environmentId === Effect.LEGACY_INFER_ENV_ID) {
      return constructIssues(
        `The effect, "${this.name}" has a reference to a target, but not to a target environment.`,
      )
    }

    // If all checks pass, then the effect does not have issues.
    return []
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
  public arguments: T['targetArgument'][]

  /**
   * A key for the effect, used to identify it within the action.
   */
  public localKey: string

  /**
   * Whether the given is outdated given the current
   * version of the target environment.
   */
  public get outdated(): boolean {
    let target = this.target

    // If the target is not set, then assume
    // the effect is not outdated.
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
    this.arguments = this.parseArguments(args)
    this.localKey = localKey
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
  ): T['targetArgument'][]

  /**
   * Checks the effect's arguments against the target's parameters.
   * @param target The target to check the effect's arguments against.
   * @returns Any issues found with the effect's arguments.
   */
  private checkTargetArguments(target: T['target']): string[] {
    let issues: string[] = []

    // Utility function to quickly process different
    // issue checkers efficiently.
    const pushIfNotNull = (issue: string | null) => {
      if (issue) {
        issues.push(issue)
      }
    }

    for (let targetArgument of this.arguments) {
      let { parameter, value, parameterId } = targetArgument

      if (!parameter) {
        issues.push(
          `The effect, "${this.name}", has an argument, "${parameterId}", that couldn't be found within the target, "${target.name}." ` +
            `Please delete the effect and create a new one.`,
        )
        continue
      }

      let dependenciesMet = this.allDependenciesMet(parameter.dependencies)

      pushIfNotNull(
        this.checkDependencyAlignment(parameter, value, dependenciesMet),
      )
      pushIfNotNull(this.checkRequiredArgs(parameter, value, dependenciesMet))
      pushIfNotNull(
        this.checkValueMatchesType(parameter, value, dependenciesMet),
      )
      pushIfNotNull(this.checkValidDropdownOption(parameter, value))
      pushIfNotNull(this.checkStringArgAgainstPattern(parameter, value))
    }

    return issues
  }

  /**
   * Checks if an argument is required and, if so, is missing a value.
   * @param parameter The target parameter to check.
   * @param argument The value of the argument in the effect.
   * @returns An issue message if the argument is required and
   * missing a value.
   * @note Utility method of {@link checkTargetArguments}.
   */
  private checkRequiredArgs(
    parameter: TTargetParameter,
    argument: unknown,
    dependenciesMet: boolean,
  ): string | null {
    // * Note: Boolean arguments are always required because
    // * they always have a value (true or false). Therefore,
    // * they don't contain the required property.
    let isBoolean = parameter.type === 'boolean'
    let required = parameter.type === 'boolean' || parameter.required
    let valueMissing = argument === undefined
    let renterValueText: string = 'Please enter a value'

    if (isBoolean) {
      renterValueText = 'Please update the value by clicking the toggle switch'
    }

    if (required && valueMissing && dependenciesMet) {
      return (
        `The argument, "${parameter.name}", within the effect, "${this.name}", is required, yet has no value. ` +
        `${renterValueText}, or delete the effect and create a new one.`
      )
    }

    return null
  }

  /**
   * Checks if an argument's value matches the type specified
   * in the target parameter.
   * @param parameter The target parameter to check.
   * @param effectArgValue The value of the argument in the effect.
   * @returns An issue message if the argument's value does not
   * match the type specified in the target parameter.
   */
  private checkValueMatchesType(
    parameter: TTargetParameter,
    effectArgValue: unknown,
    dependenciesMet: boolean,
  ): string | null {
    if (!dependenciesMet || effectArgValue === undefined) {
      return null
    }

    let typesToCheck = ['boolean', 'number', 'string']
    let expectedType = parameter.type
    let actualType = typeof effectArgValue

    // Consolidate similar types for checking.
    if (expectedType === 'large-string') {
      expectedType = 'string'
    }

    let shouldCheckType = typesToCheck.includes(expectedType)

    // If we should check the type, but it isn't a match,
    // return an issue.
    if (shouldCheckType && actualType !== expectedType) {
      return (
        `The argument, "${parameter.name}", within the effect, "${this.name}", is expected to be of type, "${expectedType}", ` +
        `but received a value of type, "${actualType}". Please update the value, or delete the effect and create a new one (ERR 30382).`
      )
    } else {
      return null
    }
  }

  /**
   * Checks if an arguments dependencies align with the current
   * value in the effect. Specifically, if the dependencies are not met,
   * the argument should not have a current value.
   * @param parameter The target parameter to check.
   * @param effectArgValue The value of the argument in the effect.
   * @returns An issue message if the argument's dependencies do not align
   * with the effect's argument value.
   * @note Utility method of {@link checkTargetArguments}.
   */
  private checkDependencyAlignment(
    parameter: TTargetParameter,
    effectArgValue: unknown,
    dependenciesMet: boolean,
  ): string | null {
    if (!dependenciesMet && effectArgValue !== undefined) {
      return (
        `The effect, "${this.name}", has an argument, "${parameter.name}", that doesn't belong. ` +
        `Please delete the effect and create a new one.`
      )
    }

    return null
  }

  /**
   * Checks if a dropdown argument is valid. Specifically,
   * that the provided value is one of the available options
   * in the dropdown.
   * @param parameter The target parameter to check.
   * @param argument The value of the argument in the effect.
   * @returns An issue message if the dropdown option is invalid.
   * @note Utility method of {@link checkTargetArguments}.
   */
  private checkValidDropdownOption(
    parameter: TTargetParameter,
    argument: unknown,
  ): string | null {
    if (
      parameter.type === 'dropdown' &&
      !parameter.options.find((option) => option.value === argument)
    ) {
      return (
        `The effect, "${this.name}", has an invalid option selected. ` +
        `Please select a valid option, or delete the effect and create a new one.`
      )
    }

    return null
  }

  /**
   * Checks if a string argument's value matches the required pattern specified
   * in the target argument.
   * @param parameter The target parameter to check.
   * @param argument The value of the argument in the effect.
   * @returns An issue message if the string argument's value does not match
   * the required pattern.
   * @note Utility method of {@link checkTargetArguments}.
   */
  private checkStringArgAgainstPattern(
    parameter: TTargetParameter,
    argument: unknown,
  ): string | null {
    if (parameter.type !== 'string' || typeof argument !== 'string') {
      return null
    }

    if (!parameter.required && argument === undefined) {
      return null
    }

    const pattern = parameter.pattern
    if (pattern instanceof RegExp && !pattern.test(argument)) {
      return (
        `The argument, "${parameter.name}", within the effect, "${this.name}", does not match the required format. ` +
        `Please update the value, or delete the effect and create a new one.`
      )
    }

    return null
  }

  /**
   * @returns The first required parameter that is not fulfilled
   * by the effect's current arguments, or `undefined` if all required
   * parameters are fulfilled.
   */
  private getFirstUnfulfilledParameter(): TTargetParameter | undefined {
    // If the target is not set, throw an error.
    if (!this.target) {
      throw new Error(
        `The effect ({ _id: "${this._id}", name: "${this.name}" }) does not have a target. ` +
          `This is likely because the target doesn't exist within any of the target environments stored in the registry.`,
      )
    }

    for (let parameter of this.target.parameters) {
      // Check if all the dependencies for the parameter are met.
      let allDependenciesMet: boolean = this.allDependenciesMet(
        parameter.dependencies,
      )

      // If all the dependencies are met and the argument is not in the effect's arguments...
      if (allDependenciesMet && !(parameter._id in this.arguments)) {
        // ...and the parameter's type is a boolean or the parameter is required, then return
        // the parameter.
        // *** Note: A boolean parameter is always required because its value
        // *** is always defined.
        if (parameter.type === 'boolean' || parameter.required) {
          return parameter
        }
      }
    }
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
   * Determines if all the dependencies passed are met based on the
   * the provided target arguments.
   * @param dependencies The dependencies to check if all are met.
   * @param targetArguments The arguments to check the dependencies against.
   * @returns If all the dependencies are met.
   */
  public allDependenciesMet = (
    dependencies: TargetDependency[] = [],
    targetArguments: T['targetArgument'][] = this.arguments,
  ): boolean => {
    // If the argument has no dependencies, then the argument is always displayed.
    if (!dependencies || dependencies.length === 0) {
      return true
    }

    // Stores the status of all the argument's dependencies.
    let areDependenciesMet: boolean[] = []
    // Create a variable to determine if all the dependencies
    // have been met.
    let allDependenciesMet: boolean

    // Iterate through the dependencies.
    dependencies.forEach((dependency) => {
      // Grab the dependency argument.
      let dependencyArg: TTargetParameter | undefined =
        this.target?.parameters.find(
          (arg: TTargetParameter) => arg._id === dependency.dependentId,
        )

      // If the dependency argument is found then check if
      // the dependency is met.
      if (dependencyArg) {
        // Initialize a variable to determine if the dependency
        // is met.
        let dependencyMet: boolean

        // Otherwise, check if the condition is met.
        dependencyMet = dependency.condition(
          targetArguments.find(
            (arg) => arg.parameterId === dependency.dependentId,
          )?.value,
        )

        // If the dependency is met then push true to the
        // dependencies met array, otherwise push false.
        dependencyMet
          ? areDependenciesMet.push(true)
          : areDependenciesMet.push(false)
      }
      // Otherwise, the dependency argument doesn't exist.
      else {
        areDependenciesMet.push(false)
      }
    })

    // If all the dependencies have been met then set the
    // variable to true, otherwise set it to false.
    allDependenciesMet = !areDependenciesMet.includes(false)

    // Return the status of all the dependencies.
    return allDependenciesMet
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
  data: TAnyObject
}
