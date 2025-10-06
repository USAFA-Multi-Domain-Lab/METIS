import { TFileMetadata } from 'metis/target-environments/args/mission-component/file-arg'
import { TMission } from '..'
import { TCreateJsonType, TMetisBaseComponents } from '../../'
import VersionToolbox from '../../../shared/toolbox/versions'
import { TTargetArg } from '../../target-environments/args'
import { TActionMetadata } from '../../target-environments/args/mission-component/action-arg'
import { TForceMetadata } from '../../target-environments/args/mission-component/force-arg'
import { TNodeMetadata } from '../../target-environments/args/mission-component/node-arg'
import Dependency from '../../target-environments/dependencies'
import { AnyObject } from '../../toolbox/objects'
import StringToolbox from '../../toolbox/strings'
import MissionAction, { TAction } from '../actions'
import MissionComponent, { TMissionComponentDefect } from '../component'
import { TForce } from '../forces'
import { TNode } from '../nodes'

/**
 * An effect that can be applied to a target.
 */
export default abstract class Effect<
  T extends TMetisBaseComponents = TMetisBaseComponents,
> extends MissionComponent<T, Effect<T>> {
  /**
   * The original data used to construct the effect.
   */
  private originalData: TEffectJson

  /**
   * The mission to which the effect belongs.
   */
  public get mission(): TMission<T> {
    return this.action.mission
  }

  /**
   * The corresponding force for the effect.
   */
  public get force(): TForce<T> {
    return this.action.force
  }

  /**
   * The corresponding node for the effect.
   */
  public get node(): TNode<T> {
    return this.action.node
  }

  /**
   * The environment in which the target exists.
   */
  public get environment(): T['targetEnv'] | null {
    return this.target?.environment ?? null
  }

  /**
   * The target to which the effect will be applied.
   */
  public target: T['target'] | null

  /**
   * The corresponding action for the effect.
   */
  public action: TAction<T>

  /**
   * The ID of the target for the effect.
   */
  public get targetId(): string {
    return this.target?._id ?? this.originalData.targetId
  }

  /**
   * The ID of the environment in which the
   * target exists.
   */
  public get environmentId(): string {
    return this.environment?._id ?? this.originalData.environmentId
  }

  /**
   * The version of the corresponding target environment
   * for which this effect is compatible. If the version
   * of the target environment does not match this version,
   * a migration may be required to apply the effect.
   */
  public targetEnvironmentVersion: string

  // Implemented
  public get path(): [...MissionComponent<any, any>[], this] {
    return [this.mission, this.force, this.node, this.action, this]
  }

  // Implemented
  public get defects(): TMissionComponentDefect[] {
    const { environment, target } = this

    // Construct defect objects for the given messages.
    const constructDefects = (
      ...messages: string[]
    ): TMissionComponentDefect[] =>
      messages.map((message) => ({ type: 'general', component: this, message }))

    // If the effect's target or target environment cannot be found, then the effect is defective.
    // *** Note: An effect grabs the target environment from the target after the
    // *** target is populated. So, if the target cannot be found, the target will
    // *** be set null which means the target environment will be null also.
    // *** Also, if a target-environment cannot be found, then obviously the target
    // *** within that environment cannot be found either.
    if (!environment || !target) {
      return constructDefects(
        `The effect, "${this.name}", has a target or a target environment that couldn't be found. ` +
          `Please contact an administrator on how to resolve this conflict, or delete the effect and create a new one.`,
      )
    }

    // If the effect's target environment version doesn't match
    // the current version, then the effect is defective.
    if (this.outdated) {
      return [
        {
          type: 'outdated',
          component: this,
          message:
            `The effect, "${this.name}", has a target environment, "${environment.name}", with an incompatible version. ` +
            `Incompatible versions can cause an effect to fail to be applied to its target during a session. ` +
            `Please click to resolve this.`,
        },
      ]
    }

    // Check the effect's arguments against the target's arguments.
    // Check each argument.
    for (let argId in this.args) {
      // Find the argument in the target.
      let arg = target.args.find((arg) => arg._id === argId)
      // If the argument cannot be found, then the effect is defective.
      if (!arg) {
        return constructDefects(
          `The effect, "${this.name}", has an argument, "${argId}", that couldn't be found within the target, "${target.name}." ` +
            `Please delete the effect and create a new one.`,
        )
      }
      // Otherwise, check the argument's value.
      else {
        // Check if the argument is required and has a value.
        // * Note: Boolean arguments are always required because
        // * they always have a value (true or false). Therefore,
        // * they don't contain the required property.
        if (
          arg.type !== 'boolean' &&
          arg.required &&
          this.args[argId] === undefined &&
          this.allDependenciesMet(arg.dependencies)
        ) {
          return constructDefects(
            `The argument, "${arg.name}", within the effect, "${this.name}", is required, yet has no value. ` +
              `Please enter a value, or delete the effect and create a new one.`,
          )
        }
        // Check if the argument is a boolean and has a value.
        if (
          arg.type === 'boolean' &&
          this.args[argId] === undefined &&
          this.allDependenciesMet(arg.dependencies)
        ) {
          return constructDefects(
            `The argument, "${arg.name}", within the effect, "${this.name}", is required, yet has no value. ` +
              `Please update the value by clicking the toggle switch, or delete the effect and create a new one.`,
          )
        }
        // Check if the argument is a dropdown and the selected option is valid.
        if (
          arg.type === 'dropdown' &&
          !arg.options.find((option) => option._id === this.args[argId])
        ) {
          return constructDefects(
            `The effect, "${this.name}", has an invalid option selected. ` +
              `Please select a valid option, or delete the effect and create a new one.`,
          )
        }

        // Check if the argument is a mission component and has a value.
        const isMissionComponentReference =
          arg.type === 'force' || arg.type === 'node' || arg.type === 'action'

        if (isMissionComponentReference && arg.required) {
          // Get the force, node, and action from the mission via the
          // data stored in the effect's arguments.
          const forceInMission = this.getForceFromArgs(argId)
          const nodeInMission = this.getNodeFromArgs(argId)
          const actionInMission = this.getActionFromArgs(argId)
          // Get the force, node, and action data from the effect's arguments.
          const forceInArgs = this.getForceMetadataInArgs(argId)
          const nodeInArgs = this.getNodeMetadataInArgs(argId)
          const actionInArgs = this.getActionMetadataInArgs(argId)
          // Check if the force is required to be in the arguments.
          const forceIsRequired = !forceInMission
          // Check if the node is required to be in the arguments.
          const nodeIsRequired =
            (arg.type === 'node' || arg.type === 'action') && !nodeInMission
          // Check if the action is required to be in the arguments.
          const actionIsRequired =
            arg.type === 'action' &&
            !(actionInMission instanceof MissionAction) &&
            actionInMission !== undefined

          // If the force cannot be found, then the effect is defective.
          if (forceIsRequired) {
            return constructDefects(
              forceInArgs
                ? `The effect, "${this.name}", is targeting a force, "${forceInArgs.forceName}", which cannot be found.`
                : `The effect, "${this.name}", targets a force which cannot be found.`,
            )
          }
          // If the node cannot be found, then the effect is defective.
          if (nodeIsRequired) {
            return constructDefects(
              nodeInArgs
                ? `The effect, "${this.name}", targets a node, "${nodeInArgs.nodeName}", which cannot be found.`
                : `The effect, "${this.name}", targets a node which cannot be found.`,
            )
          }
          // If the action cannot be found, then the effect is defective.
          if (actionIsRequired) {
            return constructDefects(
              actionInArgs
                ? `The effect, "${this.name}", targets an action, "${actionInArgs?.actionName}", which cannot be found.`
                : `The effect, "${this.name}", targets an action which cannot be found.`,
            )
          }
        }

        // If the argument exists within the effect even thought not all of its dependencies are met, then
        // effect is defective.
        if (
          !this.allDependenciesMet(arg.dependencies) &&
          this.args[argId] !== undefined
        ) {
          return constructDefects(
            `The effect, "${this.name}", has an argument, "${arg.name}", that doesn't belong. ` +
              `Please delete the effect and create a new one.`,
          )
        }
      }
    }

    // Check to see if there are any missing arguments.
    let missingArg = this.checkForMissingArg()
    // Ensure all of the required arguments are present in the effect.
    if (missingArg) {
      return constructDefects(
        `The required argument ({ _id: "${missingArg._id}", name: "${missingArg.name}" }) within the effect ({ _id: "${this._id}", name: "${this.name}" }) is missing.`,
      )
    }

    if (this.environmentId === 'infer-for-build_000038') {
      return constructDefects(
        `The effect, "${this.name}" has a reference to a target, but not to a target environment.`,
      )
    }

    // If all checks pass, then the effect is not defective.
    return []
  }

  /**
   * The impetus for the effect. Once the give event occurs
   * on an action, this effect will be enacted.
   */
  public trigger: TEffectTrigger

  /**
   * A numeric value which determines the order in which
   * the effect will be applied relative to other effects.
   */
  public order: number = 0

  /**
   * Describes the purpose of the effect.
   */
  public description: string

  /**
   * The arguments to pass to the script in the
   * target that will enact the effect.
   */
  public args: AnyObject

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
   * @param action The action that will trigger the effect.
   * @param data Additional information for the effect.
   */
  public constructor(action: T['action'], data: TEffectJson) {
    super(data._id, data.name, false)

    this.action = action
    this.target = this.determineTarget(data.targetId, data.environmentId)

    // Parse data.
    this.originalData = data
    this.targetEnvironmentVersion = data.targetEnvironmentVersion
    this.trigger = data.trigger
    this.description = data.description
    this.args = data.args
    this.localKey = data.localKey
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
      args: this.args,
      localKey: this.localKey,
    }
  }

  /**
   * Determines if all the dependencies passed are met.
   * @param dependencies The dependencies to check if all are met.
   * @param args The arguments to check the dependencies against.
   * @returns If all the dependencies are met.
   */
  public allDependenciesMet = (
    dependencies: Dependency[] = [],
    args: T['effect']['args'] = this.args,
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
    if (forceKey === 'self') forceKey = this.force.localKey
    if (forceName === 'self') forceName = this.force.name

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
    if (forceKey === 'self') forceKey = this.force.localKey
    if (forceName === 'self') forceName = this.force.name
    if (nodeKey === 'self') nodeKey = this.node.localKey
    if (nodeName === 'self') nodeName = this.node.name

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
    if (forceKey === 'self') forceKey = this.force.localKey
    if (forceName === 'self') forceName = this.force.name
    if (nodeKey === 'self') nodeKey = this.node.localKey
    if (nodeName === 'self') nodeName = this.node.name
    if (actionKey === 'self') actionKey = this.action.localKey
    if (actionName === 'self') actionName = this.action.name

    // Return the action metadata.
    return { forceKey, forceName, nodeKey, nodeName, actionKey, actionName }
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
    if (forceKey === 'self') return this.force
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
    if (nodeKey === 'self') return this.node
    if (forceKey === 'self') forceKey = this.force.localKey
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
    if (actionKey === 'self') return this.action
    if (nodeKey === 'self') nodeKey = this.node.localKey
    if (forceKey === 'self') forceKey = this.force.localKey
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
   * Default properties set when creating a new Effect object.
   */
  public static get DEFAULT_PROPERTIES(): TEffectDefaultJson {
    return {
      _id: StringToolbox.generateRandomId(),
      trigger: 'execution-success',
      order: 0,
      name: 'New Effect',
      description: '',
      args: {},
    }
  }

  /**
   * Available triggers for an effect.
   */
  public static get TRIGGERS(): TEffectTrigger[] {
    return ['execution-initiation', 'execution-success', 'execution-failure']
  }
}

/* ------------------------------ EFFECT TYPES ------------------------------ */

/**
 * Extracts the effect type from a registry of
 * METIS components that extends `TMetisBaseComponents`.
 * @param T The type registry.
 * @returns The effect type.
 */
export type TEffect<T extends TMetisBaseComponents> = T['effect']

/**
 * Valid triggers for an effect.
 */
export type TEffectTrigger =
  | 'execution-initiation'
  | 'execution-success'
  | 'execution-failure'

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
 * The default properties for an `Effect` object.
 * @inheritdoc TEffectJson
 */
type TEffectDefaultJson = Required<
  Omit<
    TEffectJson,
    'localKey' | 'targetId' | 'environmentId' | 'targetEnvironmentVersion'
  >
>
