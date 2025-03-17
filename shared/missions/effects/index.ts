import { v4 as generateHash } from 'uuid'
import { TCommonMissionTypes, TCreateMissionJsonType, TMission } from '..'
import { TTargetEnv } from '../../target-environments'
import { TTargetArg } from '../../target-environments/args'
import ForceArg from '../../target-environments/args/force-arg'
import NodeArg from '../../target-environments/args/node-arg'
import Dependency from '../../target-environments/dependencies'
import Target, { TTargetJson, TTarget } from '../../target-environments/targets'
import { AnyObject } from '../../toolbox/objects'
import { TAction } from '../actions'
import { TForce } from '../forces'
import { TNode } from '../nodes'

/**
 * An effect that can be applied to a target.
 */
export default abstract class Effect<
  T extends TCommonMissionTypes = TCommonMissionTypes,
> {
  /**
   * The corresponding mission for the effect.
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
   * The corresponding action for the effect.
   */
  public action: TAction<T>

  /**
   * The ID of the effect.
   */
  public _id: string

  // Implemented
  public name: string

  // Implemented
  public trigger: TEffectTrigger

  // Implemented
  public description: string

  // Implemented
  public targetEnvironmentVersion: string

  // Implemented
  public args: AnyObject

  /**
   * The target to which the effect will be applied.
   * @note This will be a Target Object if the data has
   * already been loaded. Otherwise, it will be the ID
   * of the target. If the target is not set, it will be
   * null.
   */
  protected _target: TTarget<T> | TTargetJson['_id'] | null
  /**
   * The target to which the effect will be applied.
   */
  public get target(): TTarget<T> | null {
    if (this._target instanceof Target) {
      return this._target
    } else {
      return null
    }
  }
  /**
   * The target to which the effect will be applied.
   */
  public set target(target: TTarget<T>) {
    if (target instanceof Target) {
      this._target = target
    } else {
      this._target = null
    }
  }

  /**
   * The ID of the target to which the effect will be applied.
   */
  public get targetId(): TTargetJson['_id'] | null {
    let target: TTarget<T> | TTargetJson['_id'] | null = this._target

    // If the target is a Target Object, return its ID.
    if (target instanceof Target) {
      return target._id
    }
    // Or, the target is an ID.
    else if (typeof target === 'string') {
      return target
    }
    // Otherwise, return the default target ID.
    else {
      return Effect.DEFAULT_PROPERTIES.targetId
    }
  }

  /**
   * The environment in which the target exists.
   */
  public get targetEnvironment(): TTargetEnv<T> | null {
    if (this.target instanceof Target) {
      return this.target.targetEnvironment
    } else {
      return null
    }
  }

  /**
   * @param action The action to which the effect belongs.
   * @param data The data to use to create the Effect.
   * @param options The options for creating the Effect.
   */
  public constructor(
    action: TAction<T>,
    data: Partial<TEffectJson> = Effect.DEFAULT_PROPERTIES,
    options: TEffectOptions = {},
  ) {
    let { populateTargets = false } = options

    this.action = action
    this._id = data._id ?? Effect.DEFAULT_PROPERTIES._id
    this.trigger = data.trigger ?? Effect.DEFAULT_PROPERTIES.trigger
    this.name = data.name ?? Effect.DEFAULT_PROPERTIES.name
    this.description = data.description ?? Effect.DEFAULT_PROPERTIES.description
    this.targetEnvironmentVersion =
      data.targetEnvironmentVersion ??
      Effect.DEFAULT_PROPERTIES.targetEnvironmentVersion
    this._target = data.targetId ?? Effect.DEFAULT_PROPERTIES.targetId
    this.args = data.args ?? Effect.DEFAULT_PROPERTIES.args

    if (populateTargets) this.populateTargetData(this.targetId)
  }

  /**
   * Populates the target data.
   */
  protected abstract populateTargetData(targetId: string | null): void

  /**
   * Converts the Effect Object to JSON.
   * @param options Options for converting the Effect to JSON.
   * @returns A JSON representation of the Effect.
   */
  public toJson(options: TEffectJsonOptions = {}): TEffectJson {
    // Construct JSON object to send to the server.
    let json: TEffectJson = {
      _id: this._id,
      trigger: this.trigger,
      name: this.name,
      description: this.description,
      targetEnvironmentVersion: this.targetEnvironmentVersion,
      targetId: this.target ? this.target._id : this.targetId,
      args: this.args,
    }

    return json
  }

  /**
   * Determines if all the dependencies passed are met.
   * @param dependencies The dependencies to check if all are met.
   * @param args The arguments to check the dependencies against.
   * @returns If all the dependencies are met.
   */
  public allDependenciesMet = (
    dependencies: Dependency[] = [],
    args: TEffect<T>['args'] = this.args,
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
   * Default properties set when creating a new Effect object.
   */
  public static get DEFAULT_PROPERTIES(): Required<TEffectJson> {
    return {
      _id: generateHash(),
      trigger: 'success',
      name: 'New Effect',
      description: '',
      targetEnvironmentVersion: '0.1',
      targetId: null,
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
 * Options for creating a new Effect Object.
 */
export type TEffectOptions = {
  /**
   * Whether to populate the targets.
   * @default false
   */
  populateTargets?: boolean
}

/**
 * Options for the Effect.toJson() method.
 */
export type TEffectJsonOptions = {}

/**
 * Extracts the effect type from the mission types.
 * @param T The mission types.
 * @returns The effect type.
 */
export type TEffect<T extends TCommonMissionTypes> = T['effect']

/**
 * Valid triggers for an effect.
 */
export type TEffectTrigger = 'immediate' | 'success' | 'failure'

/**
 * The JSON representation of an `Effect` object.
 */
export type TEffectJson = TCreateMissionJsonType<
  Effect,
  | '_id'
  | 'trigger'
  | 'name'
  | 'description'
  | 'targetEnvironmentVersion'
  | 'args',
  { targetId: TTargetJson['_id'] | null }
>
