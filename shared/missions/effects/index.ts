import { v4 as generateHash } from 'uuid'
import {
  TCommonMission,
  TCommonMissionTypes,
  TCreateMissionJsonType,
  TMission,
} from '..'
import { TCommonTargetEnv, TTargetEnv } from '../../target-environments'
import { TTargetArg } from '../../target-environments/args'
import ForceArg from '../../target-environments/args/force-arg'
import NodeArg from '../../target-environments/args/node-arg'
import Dependency from '../../target-environments/dependencies'
import Target, {
  TCommonTarget,
  TCommonTargetJson,
  TTarget,
} from '../../target-environments/targets'
import { AnyObject } from '../../toolbox/objects'
import { TAction, TCommonMissionAction } from '../actions'
import { TCommonMissionForce, TForce } from '../forces'
import { TCommonMissionNode, TNode } from '../nodes'

/**
 * An effect that can be applied to a target.
 */
export default abstract class Effect<
  T extends TCommonMissionTypes = TCommonMissionTypes,
> implements TCommonEffect
{
  // Implemented
  public get mission(): TMission<T> {
    return this.action.mission
  }

  // Implemented
  public get force(): TForce<T> {
    return this.action.force
  }

  // Implemented
  public get node(): TNode<T> {
    return this.action.node
  }

  // Implemented
  public action: TAction<T>

  // Implemented
  public _id: TCommonEffect['_id']

  // Implemented
  public name: TCommonEffect['name']

  // Implemented
  public trigger: TCommonEffect['trigger']

  // Implemented
  public description: TCommonEffect['description']

  // Implemented
  public targetEnvironmentVersion: TCommonEffect['targetEnvironmentVersion']

  // Implemented
  public args: TCommonEffect['args']

  /**
   * The target to which the effect will be applied.
   * @note This will be a Target Object if the data has
   * already been loaded. Otherwise, it will be the ID
   * of the target. If the target is not set, it will be
   * null.
   */
  protected _target: TTarget<T> | TCommonTargetJson['_id'] | null
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
  public get targetId(): TCommonTargetJson['_id'] | null {
    let target: TTarget<T> | TCommonTargetJson['_id'] | null = this._target

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
    data: Partial<TCommonEffectJson> = Effect.DEFAULT_PROPERTIES,
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

  // Inherited
  public toJson(): TCommonEffectJson {
    // Construct JSON object to send to the server.
    let json: TCommonEffectJson = {
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
  public static get DEFAULT_PROPERTIES(): Required<TCommonEffectJson> {
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
 * Interface used for the Effect class.
 * @note Any public, non-static properties and functions of the `Effect`
 * class must first be defined here for them to be accessible to other
 * effect-related classes.
 */
export interface TCommonEffect {
  /**
   * The corresponding mission for the effect.
   */
  get mission(): TCommonMission
  /**
   * The corresponding force for the effect.
   */
  get force(): TCommonMissionForce
  /**
   * The corresponding node for the effect.
   */
  get node(): TCommonMissionNode
  /**
   * The ID of the target to which the effect will be applied.
   */
  get targetId(): TCommonTargetJson['_id'] | null
  /**
   * The environment in which the target exists.
   */
  get targetEnvironment(): TCommonTargetEnv | null
  /**
   * The corresponding action for the effect.
   */
  action: TCommonMissionAction
  /**
   * The target to which the effect will be applied.
   */
  target: TCommonTarget | null
  /**
   * The ID of the effect.
   */
  _id: string
  /**
   * The name of the effect.
   */
  name: string
  /**
   * The event in the action that causes the effect to be carried out.
   */
  trigger: TEffectTrigger
  /**
   * Describes what the effect does.
   */
  description: string
  /**
   * The current version of the target environment.
   */
  targetEnvironmentVersion: string
  /**
   * The arguments used to affect the target.
   */
  args: AnyObject
  /**
   * Converts the Effect Object to JSON.
   * @returns A JSON representation of the Effect.
   */
  toJson: (options?: TEffectJsonOptions) => TCommonEffectJson
}

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
export type TCommonEffectJson = TCreateMissionJsonType<
  TCommonEffect,
  | '_id'
  | 'trigger'
  | 'name'
  | 'description'
  | 'targetEnvironmentVersion'
  | 'args',
  { targetId: TCommonTargetJson['_id'] | null }
>
