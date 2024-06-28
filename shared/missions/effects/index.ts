import { TTargetEnv } from 'metis/target-environments'
import { v4 as generateHash } from 'uuid'
import { TCommonMission, TCommonMissionTypes, TMission } from '..'
import Target, {
  TCommonTarget,
  TCommonTargetJson,
  TTarget,
} from '../../target-environments/targets'
import { AnyObject } from '../../toolbox/objects'
import { uuidTypeValidator } from '../../toolbox/validators'
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
    if (!(this._target instanceof Target)) {
      this._target = null
    }

    return this._target
  }
  /**
   * The target to which the effect will be applied.
   * @note Setting this will cause the target data to be reloaded.
   */
  public set target(target: TTarget<T> | TCommonTargetJson['_id'] | null) {
    this._target = target
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
   * The ID of the target to which the effect will be applied.
   */
  public set targetId(targetId: TCommonTargetJson['_id']) {
    this._target = targetId
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
   * Creates a new Effect Object.
   * @param action The action to which the effect belongs.
   * @param data The data to use to create the Effect.
   * @param options The options for creating the Effect.
   */
  public constructor(
    action: TAction<T>,
    data: Partial<TCommonEffectJson> = Effect.DEFAULT_PROPERTIES,
    options: TEffectOptions = {},
  ) {
    this.action = action
    this._id = data._id?.toString() ?? Effect.DEFAULT_PROPERTIES._id
    this.name = data.name ?? Effect.DEFAULT_PROPERTIES.name
    this.description = data.description ?? Effect.DEFAULT_PROPERTIES.description
    this.targetEnvironmentVersion =
      data.targetEnvironmentVersion ??
      Effect.DEFAULT_PROPERTIES.targetEnvironmentVersion
    this._target = data.targetId ?? Effect.DEFAULT_PROPERTIES.targetId
    this.args = data.args ?? Effect.DEFAULT_PROPERTIES.args

    // If the target data has been provided and
    // it's not the default target ID, then populate
    // the target data.
    if (data.targetId) {
      this.populateTargetData(data.targetId)
    }
  }

  // Inherited
  public abstract populateTargetData(
    targetId: TCommonTargetJson['_id'],
  ): Promise<void>

  // Inherited
  public toJson(): TCommonEffectJson {
    // Construct JSON object to send to the server.
    let json: TCommonEffectJson = {
      name: this.name,
      description: this.description,
      targetEnvironmentVersion: this.targetEnvironmentVersion,
      targetId: this.target ? this.target._id : this.targetId,
      args: this.args,
    }

    // Include _id if it's an ObjectId.
    // * Note: IDs in the database are
    // * stored as mongoose ObjectIds.
    // * If the ID is a UUID, then the
    // * mission won't save.
    let isObjectId: boolean = !uuidTypeValidator(this._id) ? true : false
    if (isObjectId) {
      json._id = this._id
    }

    return json
  }

  /**
   * Default properties set when creating a new Effect object.
   */
  public static get DEFAULT_PROPERTIES(): Required<TCommonEffectJson> {
    return {
      _id: generateHash(),
      name: 'New Effect',
      description: '',
      targetEnvironmentVersion: '0.1',
      targetId: null,
      args: {},
    }
  }
}

/* ------------------------------ EFFECT TYPES ------------------------------ */

/**
 * Options for creating a new Effect Object.
 */
export type TEffectOptions = {}

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
   * Populates the target data.
   * @param targetId The ID of the target to load.
   * @resolves When the target data has been loaded.
   * @rejects If there is an error loading the target data.
   */
  populateTargetData: (targetId: TCommonTargetJson['_id']) => Promise<void>
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
 * The JSON representation of an Effect object.
 */
export interface TCommonEffectJson {
  /**
   * The ID of the effect.
   */
  _id?: string
  /**
   * The name of the effect.
   */
  name: string
  /**
   * Describes what the effect does.
   */
  description: string
  /**
   * The current version of the target environment.
   */
  targetEnvironmentVersion: string
  /**
   * The ID of the target to which the effect will be applied.
   */
  targetId: TCommonTargetJson['_id'] | null
  /**
   * The arguments used to affect the target.
   */
  args: AnyObject
}
