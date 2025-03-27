import { TCreateJsonType, TMetisBaseComponents } from 'metis/index'
import { TMission, TMissionComponent } from '..'
import { TTargetArg } from '../../target-environments/args'
import ForceArg from '../../target-environments/args/force-arg'
import NodeArg from '../../target-environments/args/node-arg'
import Dependency from '../../target-environments/dependencies'
import { AnyObject } from '../../toolbox/objects'
import StringToolbox from '../../toolbox/strings'
import { TAction } from '../actions'
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
        // Check if the argument is a force and the force exists.
        if (
          arg.type === 'force' &&
          !this.mission.getForce(this.args[argId][ForceArg.FORCE_ID_KEY])
        ) {
          return `The effect, "${this.name}", targets a force, "${
            this.args[argId][ForceArg.FORCE_NAME_KEY]
          }", which cannot be found.`
        }
        // Check if the argument is a node and the node exists.
        if (arg.type === 'node') {
          // Get the force and node.
          let force = this.mission.getForce(
            this.args[argId][ForceArg.FORCE_ID_KEY],
          )
          let node = this.mission.getNode(this.args[argId][NodeArg.NODE_ID_KEY])
          // If the force cannot be found, then the effect is defective.
          if (!force) {
            return `The effect, "${this.name}", targets a force, "${
              this.args[argId][ForceArg.FORCE_NAME_KEY]
            }", which cannot be found.`
          }
          // If the node cannot be found, then the effect is defective.
          if (!node) {
            return `The effect, "${this.name}", targets a node "${
              this.args[argId][NodeArg.NODE_NAME_KEY]
            }", which cannot be found.`
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
        if (dependency.name === 'FORCE') {
          // Ensure the force argument exists within the effect arguments.
          let forceInArgs: AnyObject | undefined = args[dependency.dependentId]
          // Ensure the force ID exists within the force argument.
          let forceId: string | undefined = forceInArgs
            ? forceInArgs[ForceArg.FORCE_ID_KEY]
            : undefined
          // Get the force from the mission.
          let force = forceId ? this.mission.getForce(forceId) : undefined
          // Check if the condition is met.
          dependencyMet = dependency.condition(force)
        }
        // If the dependency is a node dependency then check
        // if the node exists and if the condition is met.
        else if (dependency.name === 'NODE') {
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
          let force = forceId ? this.mission.getForce(forceId) : undefined
          // Get the node from the mission.
          let node = nodeId ? this.mission.getNode(nodeId) : undefined
          // Create the value to check if the condition is met.
          let value = {
            force: force,
            node: node,
          }
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
