import { TCreateJsonType, TMetisBaseComponents } from 'metis/index'
import { TMission, TMissionComponent } from '..'
import { TTargetArg } from '../../target-environments/args'
import ActionArg from '../../target-environments/args/action-arg'
import ForceArg from '../../target-environments/args/force-arg'
import NodeArg from '../../target-environments/args/node-arg'
import Dependency from '../../target-environments/dependencies'
import { AnyObject } from '../../toolbox/objects'
import StringToolbox from '../../toolbox/strings'
import MissionAction, { TAction } from '../actions'
import { TForce } from '../forces'
import { TNode } from '../nodes'

/**
 * An effect that can be applied to a target.
 */
export default abstract class Effect<
  T extends TMetisBaseComponents = TMetisBaseComponents,
> implements TMissionComponent<T, Effect<T>>
{
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

  // Implemented
  public _id: string

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
  public name: string

  // Implemented
  public get path(): [...TMissionComponent<any, any>[], this] {
    return [this.mission, this.force, this.node, this.action, this]
  }

  // Implemented
  public get defective(): boolean {
    return this.defectiveMessage.length > 0
  }

  // Implemented
  public get defectiveMessage(): string {
    const { environment, target } = this

    // If the effect's target or target environment cannot be found, then the effect is defective.
    // *** Note: An effect grabs the target environment from the target after the
    // *** target is populated. So, if the target cannot be found, the target will
    // *** be set null which means the target environment will be null also.
    // *** Also, if a target-environment cannot be found, then obviously the target
    // *** within that environment cannot be found either.
    if (!environment || !target) {
      return (
        `The effect, "${this.name}", has a target or a target environment that couldn't be found. ` +
        `Please contact an administrator on how to resolve this conflict, or delete the effect and create a new one.`
      )
    }

    // If the effect's target environment version doesn't match
    // the current version, then the effect is defective.
    if (this.targetEnvironmentVersion !== environment.version) {
      return (
        `The effect, "${this.name}", has a target environment, "${environment.name}", with an incompatible version. ` +
        `Incompatible versions can cause an effect to fail to be applied to its target during a session. ` +
        `Please contact an administrator on how to resolve this conflict, or delete the effect and create a new one.`
      )
    }

    // Check the effect's arguments against the target's arguments.
    // Check each argument.
    for (let argId in this.args) {
      // Find the argument in the target.
      let arg = target.args.find((arg) => arg._id === argId)
      // If the argument cannot be found, then the effect is defective.
      if (!arg) {
        return (
          `The effect, "${this.name}", has an argument, "${argId}", that couldn't be found within the target, "${target.name}." ` +
          `Please delete the effect and create a new one.`
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
          return (
            `The argument, "${arg.name}", within the effect, "${this.name}", is required, yet has no value. ` +
            `Please enter a value, or delete the effect and create a new one.`
          )
        }
        // Check if the argument is a boolean and has a value.
        if (
          arg.type === 'boolean' &&
          this.args[argId] === undefined &&
          this.allDependenciesMet(arg.dependencies)
        ) {
          return (
            `The argument, "${arg.name}", within the effect, "${this.name}", is required, yet has no value. ` +
            `Please update the value by clicking the toggle switch, or delete the effect and create a new one.`
          )
        }
        // Check if the argument is a dropdown and the selected option is valid.
        if (
          arg.type === 'dropdown' &&
          !arg.options.find((option) => option._id === this.args[argId])
        ) {
          return (
            `The effect, "${this.name}", has an invalid option selected. ` +
            `Please select a valid option, or delete the effect and create a new one.`
          )
        }

        // todo: implement pattern validation and determine how to display the pattern to the user
        // // Check if the argument is a string and matches the required pattern.
        // if (
        //   arg.type === 'string' &&
        //   arg.pattern &&
        //   !arg.pattern.test(this.args[argId])
        // ) {
        //   this._invalidMessage =
        //     `The field labeled "${arg.name}" does not match the required pattern ${arg.pattern}` +
        //     `Please enter a valid value or delete this effect and create a new one.`
        //   return true
        // }

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
          const forceInArgs = this.getForceDataInArgs(argId)
          const nodeInArgs = this.getNodeDataInArgs(argId)
          const actionInArgs = this.getActionDataInArgs(argId)
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
            return `The effect, "${this.name}", targets a force, "${forceInArgs?._id}", which cannot be found.`
          }
          // If the node cannot be found, then the effect is defective.
          if (nodeIsRequired) {
            return `The effect, "${this.name}", targets a node "${nodeInArgs?._id}", which cannot be found.`
          }
          // If the action cannot be found, then the effect is defective.
          if (actionIsRequired) {
            return `The effect, "${this.name}", targets an action "${actionInArgs?._id}", which cannot be found.`
          }
        }

        // If the argument exists within the effect even thought not all of its dependencies are met, then
        // effect is defective.
        if (
          !this.allDependenciesMet(arg.dependencies) &&
          this.args[argId] !== undefined
        ) {
          return (
            `The effect, "${this.name}", has an argument, "${arg.name}", that doesn't belong. ` +
            `Please delete the effect and create a new one.`
          )
        }
      }
    }

    // Check to see if there are any missing arguments.
    let missingArg = this.checkForMissingArg()
    // Ensure all of the required arguments are present in the effect.
    if (missingArg) {
      return `The required argument ({ _id: "${missingArg._id}", name: "${missingArg.name}" }) within the effect ({ _id: "${this._id}", name: "${this.name}" }) is missing.`
    }

    if (this.environmentId === 'infer-for-build_000038') {
      return `The effect, "${this.name}" has a reference to a target, but not to a target environment.`
    }

    // If all checks pass, then the effect is not defective.
    return ''
  }

  /**
   * The impetus for the effect. Once the give event occurs
   * on an action, this effect will be enacted.
   */
  public trigger: TEffectTrigger

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
   * @param target The target upon which the effect will
   * be enacted.
   * @param action The action that will trigger the effect.
   * @param data Additional information for the effect.
   */
  public constructor(action: T['action'], data: TEffectJson) {
    this.action = action
    this.target = this.determineTarget(data.targetId, data.environmentId)

    // Parse data.
    this.originalData = data
    this._id = data._id
    this.targetEnvironmentVersion = data.targetEnvironmentVersion
    this.trigger = data.trigger
    this.name = data.name
    this.description = data.description
    this.args = data.args
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
      name: this.name,
      description: this.description,
      args: this.args,
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
          // Ensure the force argument exists within the effect arguments.
          let forceInArgs: AnyObject | undefined = args[dependency.dependentId]
          // Ensure the force ID exists within the force argument.
          let forceId: string | undefined = forceInArgs
            ? forceInArgs[ForceArg.FORCE_ID_KEY]
            : undefined
          // Get the force from the mission.
          let force = this.mission.getForce(forceId)
          // Check if the condition is met.
          dependencyMet = dependency.condition(force)
        }
        // If the dependency is a node dependency then check
        // if the node exists and if the condition is met.
        else if (dependency.name === 'node') {
          // Ensure the node argument exists within the effect arguments.
          let nodeInArgs: AnyObject | undefined = args[dependency.dependentId]
          // Ensure the force ID exists within the node argument.
          let forceId: string | undefined = nodeInArgs
            ? nodeInArgs[ForceArg.FORCE_ID_KEY]
            : undefined
          // Ensure the node ID exists within the node argument.
          let nodeId: string | undefined = nodeInArgs
            ? nodeInArgs[NodeArg.NODE_ID_KEY]
            : undefined
          // Get the force from the mission.
          let force = this.mission.getForce(forceId)
          // Get the node from the mission.
          let node = this.mission.getNode(nodeId)
          // Create the value to check if the condition is met.
          let value = { force, node }
          // Check if the condition is met.
          dependencyMet = dependency.condition(value)
        }
        // If the dependency is an action dependency then check
        // if the action exists and if the condition is met.
        else if (dependency.name === 'action') {
          // Ensure the action argument exists within the effect arguments.
          let actionInArgs: AnyObject | undefined = args[dependency.dependentId]
          // Ensure the force ID exists within the action argument.
          let forceId: string | undefined = actionInArgs
            ? actionInArgs[ForceArg.FORCE_ID_KEY]
            : undefined
          // Ensure the node ID exists within the action argument.
          let nodeId: string | undefined = actionInArgs
            ? actionInArgs[NodeArg.NODE_ID_KEY]
            : undefined
          // Ensure the action ID exists within the action argument.
          let actionId: string | undefined = actionInArgs
            ? actionInArgs[ActionArg.ACTION_ID_KEY]
            : undefined
          // Get the force from the mission.
          let force = this.mission.getForce(forceId)
          // Get the node from the mission.
          let node = this.mission.getNode(nodeId)
          // Get the action from the mission.
          let action = this.mission.getAction(actionId)
          // Create the value to check if the condition is met.
          let value = { force, node, action }
          // Check if the condition is met.
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
   * Gets the force ID and name stored in the effect's arguments.
   * @param argId The ID of the argument to get the force from.
   * @returns The force ID and name if found, otherwise undefined.
   */
  public getForceDataInArgs = (
    argId: string,
  ): { _id: string; name: string } | undefined => {
    // Get the force argument.
    let forceInArgs: AnyObject | undefined = this.args[argId]
    // Ensure the force ID exists within the force argument.
    let forceId: string | undefined = forceInArgs
      ? forceInArgs[ForceArg.FORCE_ID_KEY]
      : undefined
    // Ensure the force name exists within the force argument.
    let forceName: string | undefined = forceInArgs
      ? forceInArgs[ForceArg.FORCE_NAME_KEY]
      : undefined
    // If the force ID is not found, then return undefined.
    if (!forceId || !forceName) return undefined
    // Otherwise, return the force ID and name.
    return { _id: forceId, name: forceName }
  }

  /**
   * Gets the node ID and name stored in the effect's arguments.
   * @param argId The ID of the argument to get the node from.
   * @returns The node ID and name if found, otherwise undefined.
   */
  public getNodeDataInArgs = (
    argId: string,
  ): { _id: string; name: string } | undefined => {
    // Get the node argument.
    let nodeInArgs: AnyObject | undefined = this.args[argId]
    // Ensure the node ID exists within the node argument.
    let nodeId: string | undefined = nodeInArgs
      ? nodeInArgs[NodeArg.NODE_ID_KEY]
      : undefined
    // Ensure the node name exists within the node argument.
    let nodeName: string | undefined = nodeInArgs
      ? nodeInArgs[NodeArg.NODE_NAME_KEY]
      : undefined
    // If the node ID is not found, then return undefined.
    if (!nodeId || !nodeName) return undefined
    // Otherwise, return the node ID and name.
    return { _id: nodeId, name: nodeName }
  }

  /**
   * Gets the action ID and name stored in the effect's arguments.
   * @param argId The ID of the argument to get the action from.
   * @returns The action ID and name if found, otherwise undefined.
   */
  public getActionDataInArgs = (
    argId: string,
  ): { _id: string; name: string } | undefined => {
    // Get the action argument.
    let actionInArgs: AnyObject | undefined = this.args[argId]
    // Ensure the action ID exists within the action argument.
    let actionId: string | undefined = actionInArgs
      ? actionInArgs[ActionArg.ACTION_ID_KEY]
      : undefined
    // Ensure the action name exists within the action argument.
    let actionName: string | undefined = actionInArgs
      ? actionInArgs[ActionArg.ACTION_NAME_KEY]
      : undefined
    // If the action ID is not found, then return undefined.
    if (!actionId || !actionName) return undefined
    // Otherwise, return the action ID and name.
    return { _id: actionId, name: actionName }
  }

  /**
   * Gets the force stored in the effect's arguments.
   * @param argId The ID of the argument to get the force from.
   * @returns The force if found, otherwise undefined.
   */
  public getForceFromArgs = (argId: string): T['force'] | undefined => {
    // Get the force argument.
    let forceInArgs: AnyObject | undefined = this.args[argId]
    // Ensure the force ID exists within the force argument.
    let forceId: string | undefined = forceInArgs
      ? forceInArgs[ForceArg.FORCE_ID_KEY]
      : undefined
    // Get the force from the mission.
    return this.mission.getForce(forceId)
  }

  /**
   * Gets the node stored in the effect's arguments.
   * @param argId The ID of the argument to get the node from.
   * @returns The node if found, otherwise undefined.
   */
  public getNodeFromArgs = (argId: string): T['node'] | undefined => {
    // Get the node argument.
    let nodeInArgs: AnyObject | undefined = this.args[argId]
    // Ensure the node ID exists within the node argument.
    let nodeId: string | undefined = nodeInArgs
      ? nodeInArgs[NodeArg.NODE_ID_KEY]
      : undefined
    // Get the node from the mission.
    return this.mission.getNode(nodeId)
  }

  /**
   * Gets the action stored in the effect's arguments.
   * @param argId The ID of the argument to get the action from.
   * @returns The action if found, otherwise undefined.
   */
  public getActionFromArgs = (argId: string): T['action'] | undefined => {
    // Get the action argument.
    let actionInArgs: AnyObject | undefined = this.args[argId]
    // Ensure the action ID exists within the action argument.
    let actionId: string | undefined = actionInArgs
      ? actionInArgs[ActionArg.ACTION_ID_KEY]
      : undefined

    let action = this.mission.getAction(actionId)
    if (action instanceof MissionAction) return action
    return undefined
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
  public static get DEFAULT_PROPERTIES(): Required<
    Omit<TEffectJson, 'targetId' | 'environmentId' | 'targetEnvironmentVersion'>
  > {
    return {
      _id: StringToolbox.generateRandomId(),
      trigger: 'success',
      name: 'New Effect',
      description: '',
      args: {},
    }
  }

  /**
   * Available triggers for an effect.
   */
  public static get TRIGGERS(): TEffectTrigger[] {
    return ['immediate', 'success', 'failure']
  }

  /**
   * @param value The value to validate.
   * @returns Whether the value is a valid effect trigger.
   */
  public static isValidTrigger(value: any): boolean {
    return Effect.TRIGGERS.includes(value)
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
export type TEffectTrigger = 'immediate' | 'success' | 'failure'

/**
 * The JSON representation of an `Effect` object.
 */
export type TEffectJson = TCreateJsonType<
  Effect,
  | '_id'
  | 'targetId'
  | 'environmentId'
  | 'targetEnvironmentVersion'
  | 'trigger'
  | 'name'
  | 'description'
  | 'args'
>
