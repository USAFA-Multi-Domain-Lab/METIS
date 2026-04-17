import type { TMissionComponentArg } from '@shared/target-environments/args/mission-component/MissionComponentArg'
import type { TTargetArg } from '../../target-environments/args/Arg'
import type { TargetDependency } from '../../target-environments/targets/TargetDependency'
import type {
  TActionMetadata,
  TFileMetadata,
  TForceMetadata,
  TNodeMetadata,
  TPoolMetadata,
  TResourceMetadata,
} from '../../target-environments/types'
import type { TAnyObject } from '../../toolbox/objects/ObjectToolbox'
import { StringToolbox } from '../../toolbox/strings/StringToolbox'
import { VersionToolbox } from '../../toolbox/strings/VersionToolbox'
import { MissionAction } from '../actions/MissionAction'
import type { ResourcePool } from '../forces/ResourcePool'
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

    // Check the effect's arguments against the target's arguments.
    let argIssues = this.checkEffectArgs(target)
    if (argIssues.length) return constructIssues(...argIssues)

    // Check to see if there are any missing arguments.
    let missingArg = this.checkForMissingArg()
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
  public args: TAnyObject

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
    args: TAnyObject,
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
    this.args = args
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
   * Checks the effect's arguments against the target's arguments.
   * @param target The target to check the effect's arguments against.
   * @returns Any issues found with the effect's arguments.
   */
  private checkEffectArgs(target: T['target']): string[] {
    let issues: string[] = []

    // Utility function to quickly process different
    // issue checkers efficiently.
    const pushIfNotNull = (issue: string | null) => {
      if (issue) {
        issues.push(issue)
      }
    }

    for (let argId in this.args) {
      let targetArg = target.getArgById(argId)
      let effectArgValue = this.args[argId]

      if (!targetArg) {
        issues.push(
          `The effect, "${this.name}", has an argument, "${argId}", that couldn't be found within the target, "${target.name}." ` +
            `Please delete the effect and create a new one.`,
        )
        continue
      }

      let dependenciesMet = this.allDependenciesMet(targetArg.dependencies)

      pushIfNotNull(
        this.checkDependencyAlignment(
          targetArg,
          effectArgValue,
          dependenciesMet,
        ),
      )
      pushIfNotNull(
        this.checkRequiredArgs(targetArg, effectArgValue, dependenciesMet),
      )
      pushIfNotNull(
        this.checkValueMatchesType(targetArg, effectArgValue, dependenciesMet),
      )
      pushIfNotNull(this.checkValidDropdownOption(targetArg, effectArgValue))
      pushIfNotNull(this.checkMissionComponentArg(targetArg, effectArgValue))
      pushIfNotNull(
        this.checkStringArgAgainstPattern(targetArg, effectArgValue),
      )
    }

    return issues
  }

  /**
   * Checks if an argument is required and, if so, is missing a value.
   * @param targetArg The target argument to check.
   * @param effectArgValue The value of the argument in the effect.
   * @returns An issue message if the argument is required and
   * missing a value.
   * @note Utility method of {@link checkEffectArgs}.
   */
  private checkRequiredArgs(
    targetArg: TTargetArg,
    effectArgValue: unknown,
    dependenciesMet: boolean,
  ): string | null {
    // * Note: Boolean arguments are always required because
    // * they always have a value (true or false). Therefore,
    // * they don't contain the required property.
    let isBoolean = targetArg.type === 'boolean'
    let required = targetArg.type === 'boolean' || targetArg.required
    let valueMissing = effectArgValue === undefined
    let renterValueText: string = 'Please enter a value'

    if (isBoolean) {
      renterValueText = 'Please update the value by clicking the toggle switch'
    }

    if (required && valueMissing && dependenciesMet) {
      return (
        `The argument, "${targetArg.name}", within the effect, "${this.name}", is required, yet has no value. ` +
        `${renterValueText}, or delete the effect and create a new one.`
      )
    }

    return null
  }

  /**
   * Checks if an argument's value matches the type specified
   * in the target argument.
   * @param targetArg The target argument to check.
   * @param effectArgValue The value of the argument in the effect.
   * @returns An issue message if the argument's value does not
   * match the type specified in the target argument.
   */
  private checkValueMatchesType(
    targetArg: TTargetArg,
    effectArgValue: unknown,
    dependenciesMet: boolean,
  ): string | null {
    if (!dependenciesMet || effectArgValue === undefined) {
      return null
    }

    let typesToCheck = ['boolean', 'number', 'string']
    let expectedType = targetArg.type
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
        `The argument, "${targetArg.name}", within the effect, "${this.name}", is expected to be of type, "${expectedType}", ` +
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
   * @param targetArg The target argument to check.
   * @param effectArgValue The value of the argument in the effect.
   * @returns An issue message if the argument's dependencies do not align
   * with the effect's argument value.
   * @note Utility method of {@link checkEffectArgs}.
   */
  private checkDependencyAlignment(
    targetArg: TTargetArg,
    effectArgValue: unknown,
    dependenciesMet: boolean,
  ): string | null {
    if (!dependenciesMet && effectArgValue !== undefined) {
      return (
        `The effect, "${this.name}", has an argument, "${targetArg.name}", that doesn't belong. ` +
        `Please delete the effect and create a new one.`
      )
    }

    return null
  }

  /**
   * Checks if a dropdown argument is valid. Specifically,
   * that the provided value is one of the available options
   * in the dropdown.
   * @param targetArg The target argument to check.
   * @param effectArgValue The value of the argument in the effect.
   * @returns An issue message if the dropdown option is invalid.
   * @note Utility method of {@link checkEffectArgs}.
   */
  private checkValidDropdownOption(
    targetArg: TTargetArg,
    effectArgValue: unknown,
  ): string | null {
    if (
      targetArg.type === 'dropdown' &&
      !targetArg.options.find((option) => option.value === effectArgValue)
    ) {
      return (
        `The effect, "${this.name}", has an invalid option selected. ` +
        `Please select a valid option, or delete the effect and create a new one.`
      )
    }

    return null
  }

  /**
   * Checks if a mission-component argument is valid. Specifically,
   * it verifies the existence of referenced mission components.
   * @param targetArg The target argument to check.
   * @param effectArgValue The value of the argument in the effect.
   * @returns An issue message if the mission component reference
   * is invalid.
   * @note Utility method of {@link checkEffectArgs}.
   */
  private checkMissionComponentArg(
    targetArg: TTargetArg,
    effectArgValue: unknown,
  ): string | null {
    let { _id: argId, type } = targetArg

    const isMissionComponentRef =
      type === 'action' ||
      type === 'pool' ||
      type === 'node' ||
      type === 'force' ||
      type === 'file'

    if (!isMissionComponentRef || effectArgValue === undefined) {
      return null
    }

    // Check force reference (required for force, pool, node, and action types)
    if (
      type === 'force' ||
      type === 'pool' ||
      type === 'node' ||
      type === 'action'
    ) {
      const forceInMission = this.getForceFromArgs(argId)
      if (!forceInMission) {
        const forceInArgs = this.getForceMetadataInArgs(argId)
        return this.buildComponentNotFoundMessage(
          'force',
          forceInArgs?.forceName,
        )
      }
    }

    // Check pool reference (required for pool type)
    if (type === 'pool') {
      let poolInMission = this.getPoolFromArgs(argId)
      if (!poolInMission) {
        let poolInArgs = this.getPoolMetadataInArgs(argId)
        return this.buildComponentNotFoundMessage('pool', poolInArgs?.poolName)
      }
    }

    // Check node reference (required for node and action types)
    if (type === 'node' || type === 'action') {
      const nodeInMission = this.getNodeFromArgs(argId)
      if (!nodeInMission) {
        const nodeInArgs = this.getNodeMetadataInArgs(argId)
        return this.buildComponentNotFoundMessage('node', nodeInArgs?.nodeName)
      }
    }

    // Check action reference (required for action type)
    if (type === 'action') {
      // Only validate if a specific actionKey is stored. If absent, the arg
      // targets all actions in the node ("All Actions"), which is valid.
      const actionInArgs = this.getActionMetadataInArgs(argId)
      const actionInMission = this.getActionFromArgs(argId)

      if (actionInArgs && !actionInMission) {
        return this.buildComponentNotFoundMessage(
          'action',
          actionInArgs.actionName,
        )
      }
    }

    // Check file reference (required for file type)
    if (type === 'file') {
      const fileInMission = this.getFileFromArgs(argId)
      if (!fileInMission) {
        const fileInArgs = this.getFileMetadataInArgs(argId)
        return this.buildComponentNotFoundMessage('file', fileInArgs?.fileName)
      }
    }

    return null
  }

  /**
   * Checks if a string argument's value matches the required pattern specified
   * in the target argument.
   * @param targetArg The target argument to check.
   * @param effectArgValue The value of the argument in the effect.
   * @returns An issue message if the string argument's value does not match
   * the required pattern.
   * @note Utility method of {@link checkEffectArgs}.
   */
  private checkStringArgAgainstPattern(
    targetArg: TTargetArg,
    effectArgValue: unknown,
  ): string | null {
    if (targetArg.type !== 'string' || typeof effectArgValue !== 'string') {
      return null
    }

    if (!targetArg.required && effectArgValue === undefined) {
      return null
    }

    const pattern = targetArg.pattern
    if (pattern instanceof RegExp && !pattern.test(effectArgValue)) {
      return (
        `The argument, "${targetArg.name}", within the effect, "${this.name}", does not match the required format. ` +
        `Please update the value, or delete the effect and create a new one.`
      )
    }

    return null
  }

  /**
   * Builds a standardized error message for a missing mission component.
   * @param componentType The type of component that cannot be found.
   * @param componentName The name of the component, if available.
   * @returns The error message.
   */
  private buildComponentNotFoundMessage(
    componentType: TMissionComponentArg['type'],
    componentName?: string,
  ): string {
    let verb = 'targets'
    if (componentType === 'force') {
      verb = 'is targeting'
    }

    let article = 'a'
    if (componentType === 'action') {
      article = 'an'
    }

    const actionGuidance = `Please select a valid ${componentType} or delete the effect and create a new one.`

    if (componentName) {
      return `The effect, "${this.name}", ${verb} ${article} ${componentType}, "${componentName}", which cannot be found. ${actionGuidance}`
    }
    return `The effect, "${this.name}", ${verb} ${article} ${componentType} which cannot be found. ${actionGuidance}`
  }

  /**
   * Checks if there are any required target-arguments missing in the effect.
   * @returns The missing argument if there is one.
   */
  private checkForMissingArg(): TTargetArg | undefined {
    // If the target is not set, throw an error.
    if (!this.target) {
      throw new Error(
        `The effect ({ _id: "${this._id}", name: "${this.name}" }) does not have a target. ` +
          `This is likely because the target doesn't exist within any of the target environments stored in the registry.`,
      )
    }

    for (let arg of this.target.args) {
      // Check if all the dependencies for the argument are met.
      let allDependenciesMet: boolean = this.allDependenciesMet(
        arg.dependencies,
      )

      // If all the dependencies are met and the argument is not in the effect's arguments...
      if (allDependenciesMet && !(arg._id in this.args)) {
        // ...and the argument's type is a boolean or the argument is required, then return
        // the argument.
        // *** Note: A boolean argument is always required because it's value
        // *** is always defined.
        if (arg.type === 'boolean' || arg.required) {
          return arg
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
      args: structuredClone(this.args),
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
   * Determines if all the dependencies passed are met.
   * @param dependencies The dependencies to check if all are met.
   * @param args The arguments to check the dependencies against.
   * @returns If all the dependencies are met.
   */
  public allDependenciesMet = (
    dependencies: TargetDependency[] = [],
    args: TAnyObject = this.args,
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
      let dependencyArg: TTargetArg | undefined = this.target?.args.find(
        (arg: TTargetArg) => arg._id === dependency.dependentId,
      )

      // If the dependency argument is found then check if
      // the dependency is met.
      if (dependencyArg) {
        // Initialize a variable to determine if the dependency
        // is met.
        let dependencyMet: boolean

        // If the dependency is a force dependency then check
        // if the force exists and if the condition is met.
        if (dependency.name === 'force') {
          const force = this.getForceFromArgs(dependency.dependentId)
          const value = { force }
          dependencyMet = dependency.condition(value)
        }
        // If the dependency is a node dependency then check
        // if the node exists and if the condition is met.
        else if (dependency.name === 'pool') {
          const force = this.getForceFromArgs(dependency.dependentId)
          const pool = this.getPoolFromArgs(dependency.dependentId)
          const value = { force, pool }
          dependencyMet = dependency.condition(value)
        }
        // If the dependency is a node dependency then check
        // if the node exists and if the condition is met.
        else if (dependency.name === 'node') {
          const force = this.getForceFromArgs(dependency.dependentId)
          const node = this.getNodeFromArgs(dependency.dependentId)
          const value = { force, node }
          dependencyMet = dependency.condition(value)
        }
        // If the dependency is an action dependency then check
        // if the action exists and if the condition is met.
        else if (dependency.name === 'action') {
          const force = this.getForceFromArgs(dependency.dependentId)
          const node = this.getNodeFromArgs(dependency.dependentId)
          const action = this.getActionFromArgs(dependency.dependentId)
          const value = { force, node, action }
          dependencyMet = dependency.condition(value)
        }
        // If the dependency is a file dependency then check
        // if the file exists and if the condition is met.
        else if (dependency.name === 'file') {
          const file = this.getFileFromArgs(dependency.dependentId)
          const value = { file }
          dependencyMet = dependency.condition(value)
        }
        // If the dependency is a resource dependency then check
        // if the resource exists and if the condition is met.
        else if (dependency.name === 'resource') {
          const resource = this.getResourceFromArgs(dependency.dependentId)
          const value = { resource }
          dependencyMet = dependency.condition(value)
        }
        // Otherwise, check if the condition is met.
        else {
          dependencyMet = dependency.condition(args[dependency.dependentId])
        }

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
   * Gets the force metadata that's stored in the effect's arguments.
   * @param argId The ID of the argument to get the force from.
   * @returns The force metadata if found, otherwise undefined.
   */
  public getForceMetadataInArgs = (
    argId: string,
  ): Required<TForceMetadata> | undefined => {
    const forceInArgs: TForceMetadata | undefined = this.args[argId]

    // If the force argument is not found, then return undefined.
    if (!forceInArgs) return undefined
    // Otherwise, extract the metadata.
    let forceKey = forceInArgs.forceKey
    let forceName = forceInArgs.forceName

    // If any metadata is missing, then return undefined.
    if (!forceKey || !forceName) return undefined

    // Handle force keys that are set to 'self'.
    if (forceKey === 'self') {
      if (!this.sourceForce) return undefined
      forceKey = this.sourceForce.localKey
      forceName = this.sourceForce.name
    }

    // Return the force metadata.
    return { forceKey, forceName }
  }

  /**
   * Gets the node metadata stored in the effect's arguments.
   * @param argId The ID of the argument to get the node from.
   * @returns The node metadata if found, otherwise undefined.
   */
  public getNodeMetadataInArgs = (
    argId: string,
  ): Required<TNodeMetadata> | undefined => {
    let nodeInArgs: TNodeMetadata | undefined = this.args[argId]

    // If the node argument is not found, then return undefined.
    if (!nodeInArgs) return undefined
    // Otherwise, extract the metadata.
    let forceKey = nodeInArgs.forceKey
    let forceName = nodeInArgs.forceName
    let nodeKey = nodeInArgs.nodeKey
    let nodeName = nodeInArgs.nodeName

    // If the node ID is not found, then return undefined.
    if (!forceKey || !forceName || !nodeKey || !nodeName) return undefined

    // Handle force and node keys that are set to 'self'.
    if (forceKey === 'self') {
      if (!this.sourceForce) return undefined
      forceKey = this.sourceForce.localKey
      forceName = this.sourceForce.name
    }
    if (nodeKey === 'self') {
      if (!this.sourceNode) return undefined
      nodeKey = this.sourceNode.localKey
      nodeName = this.sourceNode.name
    }

    // Return the node metadata.
    return { forceKey, forceName, nodeKey, nodeName }
  }

  /**
   * Gets the action metadata stored in the effect's arguments.
   * @param argId The ID of the argument to get the action from.
   * @returns The action metadata if found, otherwise undefined.
   */
  public getActionMetadataInArgs = (
    argId: string,
  ): Required<TActionMetadata> | undefined => {
    let actionInArgs: TActionMetadata | undefined = this.args[argId]

    // If the action argument is not found, then return undefined.
    if (!actionInArgs) return undefined
    // Otherwise, extract the metadata.
    let forceKey = actionInArgs.forceKey
    let forceName = actionInArgs.forceName
    let nodeKey = actionInArgs.nodeKey
    let nodeName = actionInArgs.nodeName
    let actionKey = actionInArgs.actionKey
    let actionName = actionInArgs.actionName

    // If any metadata is missing, then return undefined.
    if (
      !forceKey ||
      !forceName ||
      !nodeKey ||
      !nodeName ||
      !actionKey ||
      !actionName
    ) {
      return undefined
    }

    // Handle force, node, and action keys that are set to 'self'.
    if (forceKey === 'self') {
      if (!this.sourceForce) return undefined
      forceKey = this.sourceForce.localKey
      forceName = this.sourceForce.name
    }
    if (nodeKey === 'self') {
      if (!this.sourceNode) return undefined
      nodeKey = this.sourceNode.localKey
      nodeName = this.sourceNode.name
    }
    if (actionKey === 'self') {
      if (!this.sourceAction) return undefined
      actionKey = this.sourceAction.localKey
      actionName = this.sourceAction.name
    }

    // Return the action metadata.
    return { forceKey, forceName, nodeKey, nodeName, actionKey, actionName }
  }

  /**
   * Gets the resource metadata stored in the effect's arguments.
   * @param argId The ID of the argument from which to get the resource.
   * @returns The resource metadata if found, otherwise undefined.
   */
  public getResourceMetadataInArgs = (
    argId: string,
  ): Required<TResourceMetadata> | undefined => {
    const resourceInArgs: TResourceMetadata | undefined = this.args[argId]

    // If the resource argument is not found, then return undefined.
    if (!resourceInArgs) return undefined
    // Otherwise, extract the metadata.
    let resourceId = resourceInArgs.resourceId
    let resourceName = resourceInArgs.resourceName

    // If any metadata is missing, then return undefined.
    if (!resourceId || !resourceName) return undefined

    // Return the resource metadata.
    return { resourceId, resourceName }
  }

  /**
   * Gets the pool metadata stored in the effect's arguments.
   * @param argId The ID of the argument to get the pool from.
   * @returns The pool metadata if found, otherwise undefined.
   */
  public getPoolMetadataInArgs = (
    argId: string,
  ): Required<TPoolMetadata> | undefined => {
    const poolInArgs: TPoolMetadata | undefined = this.args[argId]

    // If the pool argument is not found, then return undefined.
    if (!poolInArgs) return undefined
    // Otherwise, extract the metadata.
    let forceKey = poolInArgs.forceKey
    let forceName = poolInArgs.forceName
    let poolKey = poolInArgs.poolKey
    let poolName = poolInArgs.poolName

    // If any metadata is missing, then return undefined.
    if (!forceKey || !forceName || !poolKey || !poolName) return undefined

    // Handle force keys that are set to 'self'.
    if (forceKey === 'self') {
      if (!this.sourceForce) return undefined
      forceKey = this.sourceForce.localKey
      forceName = this.sourceForce.name
    }

    // Return the pool metadata.
    return { forceKey, forceName, poolKey, poolName }
  }

  /**
   * Gets the file metadata that's stored in the effect's arguments.
   * @param argId The ID of the argument from which to get the file.
   * @returns The file metadata if found, otherwise undefined.
   */
  public getFileMetadataInArgs = (
    argId: string,
  ): Required<TFileMetadata> | undefined => {
    const fileInArgs: TFileMetadata | undefined = this.args[argId]

    // If the file argument is not found, then return undefined.
    if (!fileInArgs) return undefined
    // Otherwise, extract the metadata.
    let fileId = fileInArgs.fileId
    let fileName = fileInArgs.fileName

    // If any metadata is missing, then return undefined.
    if (!fileId || !fileName) return undefined

    // Return the file metadata.
    return { fileId, fileName }
  }

  /**
   * Gets the force stored in the effect's arguments.
   * @param argId The ID of the argument to get the force from.
   * @returns The force if found, otherwise undefined.
   */
  public getForceFromArgs = (argId: string): T['force'] | undefined => {
    // Get the force argument.
    const forceInArgs: TForceMetadata | undefined = this.args[argId]
    // Extract the metadata.
    let forceKey = forceInArgs?.forceKey
    // Handle force keys that are set to 'self'.
    if (forceKey === 'self') {
      if (!this.sourceForce) return undefined
      return this.sourceForce
    }
    // Get the force from the mission.
    return this.mission.getForceByLocalKey(forceKey)
  }

  /**
   * Gets the node stored in the effect's arguments.
   * @param argId The ID of the argument to get the node from.
   * @returns The node if found, otherwise undefined.
   */
  public getNodeFromArgs = (argId: string): T['node'] | undefined => {
    // Get the node argument.
    const nodeInArgs: TNodeMetadata | undefined = this.args[argId]
    // Extract the metadata.
    let forceKey = nodeInArgs?.forceKey
    let nodeKey = nodeInArgs?.nodeKey
    // Handle force and node keys that are set to 'self'.
    if (nodeKey === 'self') {
      if (!this.sourceNode) return undefined
      return this.sourceNode
    }
    if (forceKey === 'self') {
      if (!this.sourceForce) return undefined
      forceKey = this.sourceForce.localKey
    }
    // Get the node from the mission.
    return this.mission.getNodeByLocalKey(forceKey, nodeKey)
  }

  /**
   * Gets the action stored in the effect's arguments.
   * @param argId The ID of the argument to get the action from.
   * @returns The action if found, otherwise undefined.
   */
  public getActionFromArgs = (argId: string): T['action'] | undefined => {
    // Get the action argument.
    const actionInArgs: TActionMetadata | undefined = this.args[argId]
    // Extract the metadata.
    let forceKey = actionInArgs?.forceKey
    let nodeKey = actionInArgs?.nodeKey
    let actionKey = actionInArgs?.actionKey
    // Handle force, node, and action keys that are set to 'self'.
    if (actionKey === 'self') {
      if (!this.sourceAction) return undefined
      return this.sourceAction
    }
    if (nodeKey === 'self') {
      if (!this.sourceNode) return undefined
      nodeKey = this.sourceNode.localKey
    }
    if (forceKey === 'self') {
      if (!this.sourceForce) return undefined
      forceKey = this.sourceForce.localKey
    }
    // Get the action from the mission.
    const action = this.mission.getActionByLocalKey(
      forceKey,
      nodeKey,
      actionKey,
    )
    // If the action anything other than a MissionAction, then return undefined.
    if (!(action instanceof MissionAction)) return undefined
    // Otherwise, return the action.
    return action
  }

  /**
   * Gets the resource stored in the effect's arguments.
   * @param argId The ID of the argument from which to get the resource.
   * @returns The resource if found, otherwise undefined.
   */
  public getResourceFromArgs = (argId: string): T['resource'] | undefined => {
    // Get the resource argument.
    const resourceInArgs: TResourceMetadata | undefined = this.args[argId]
    // Extract the metadata.
    const resourceId = resourceInArgs?.resourceId
    // Get the resource from the mission.
    return this.mission.getResourceById(resourceId)
  }

  /**
   * Gets the pool stored in the effect's arguments.
   * @param argId The ID of the argument from which to get the pool.
   * @returns The pool if found, otherwise undefined.
   */
  public getPoolFromArgs = (argId: string): ResourcePool<T> | undefined => {
    const poolInArgs: TPoolMetadata | undefined = this.args[argId]
    let forceKey = poolInArgs?.forceKey
    let poolKey = poolInArgs?.poolKey
    // Handle force keys that are set to 'self'.
    if (forceKey === 'self') {
      if (!this.sourceForce) return undefined
      forceKey = this.sourceForce.localKey
    }
    return this.mission.getPoolByLocalKey(forceKey, poolKey) as
      | ResourcePool<T>
      | undefined
  }

  /**
   * Gets the file stored in the effect's arguments.
   * @param argId The ID of the argument from which to
   * get the file.
   * @returns The file if found, otherwise undefined.
   */
  public getFileFromArgs = (argId: string): T['missionFile'] | undefined => {
    // Get the file argument.
    const fileInArgs: TFileMetadata | undefined = this.args[argId]
    // Extract the metadata.
    const fileId = fileInArgs?.fileId
    // Get the file from the mission.
    return this.mission.getFileById(fileId)
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
      args: {},
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
    'args',
    'targetId',
    'environmentId',
    'targetEnvironmentVersion',
    'trigger',
    'order',
    'localKey',
  ],
  indirect: [{}],
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
