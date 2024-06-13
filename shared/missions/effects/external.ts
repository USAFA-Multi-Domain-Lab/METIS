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
 * An external effect that can be applied to a target.
 */
export default abstract class ExternalEffect<
  T extends TCommonMissionTypes = TCommonMissionTypes,
> implements TCommonExternalEffect
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
  public _id: TCommonExternalEffect['_id']

  // Implemented
  public name: TCommonExternalEffect['name']

  // Implemented
  public description: TCommonExternalEffect['description']

  // Implemented
  public targetEnvironmentVersion: TCommonExternalEffect['targetEnvironmentVersion']

  // Implemented
  public args: TCommonExternalEffect['args']

  /**
   * The target to which the external effect will be applied.
   * @note This will be a Target Object if the data has
   * already been loaded. Otherwise, it will be the ID
   * of the target. If the target is not set, it will be
   * null.
   */
  protected _target: TTarget<T> | TCommonTargetJson['_id'] | null
  /**
   * The target to which the external effect will be applied.
   */
  public get target(): TTarget<T> | null {
    if (!(this._target instanceof Target)) {
      this._target = null
    }

    return this._target
  }
  /**
   * The target to which the external effect will be applied.
   * @note Setting this will cause the target data to be reloaded.
   */
  public set target(target: TTarget<T> | TCommonTargetJson['_id'] | null) {
    this._target = target
  }

  /**
   * The ID of the target to which the external effect will be applied.
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
      return ExternalEffect.DEFAULT_PROPERTIES.targetId
    }
  }
  /**
   * The ID of the target to which the external effect will be applied.
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
   * Creates a new External Effect Object.
   * @param action The action to which the external effect belongs.
   * @param data The data to use to create the External Effect.
   * @param options The options for creating the External Effect.
   */
  public constructor(
    action: TAction<T>,
    data: Partial<TCommonExternalEffectJson> = ExternalEffect.DEFAULT_PROPERTIES,
    options: TExternalEffectOptions = {},
  ) {
    this.action = action
    this._id = data._id?.toString() ?? ExternalEffect.DEFAULT_PROPERTIES._id
    this.name = data.name ?? ExternalEffect.DEFAULT_PROPERTIES.name
    this.description =
      data.description ?? ExternalEffect.DEFAULT_PROPERTIES.description
    this.targetEnvironmentVersion =
      data.targetEnvironmentVersion ??
      ExternalEffect.DEFAULT_PROPERTIES.targetEnvironmentVersion
    this._target = data.targetId ?? ExternalEffect.DEFAULT_PROPERTIES.targetId
    this.args = data.args ?? ExternalEffect.DEFAULT_PROPERTIES.args

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
  public toJson(): TCommonExternalEffectJson {
    // Construct JSON object to send to the server.
    let json: TCommonExternalEffectJson = {
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
   * Default properties set when creating a new External Effect object.
   */
  public static get DEFAULT_PROPERTIES(): Required<TCommonExternalEffectJson> {
    return {
      _id: generateHash(),
      name: 'New Effect',
      description: '<p><br></p>',
      targetEnvironmentVersion: '0.1',
      targetId: null,
      args: {},
    }
  }
}

/* ------------------------------ EXTERNAL EFFECT TYPES ------------------------------ */

/**
 * Options for creating a new External Effect Object.
 */
export type TExternalEffectOptions = {}

/**
 * Options for the ExternalEffect.toJson() method.
 */
export type TExternalEffectJsonOptions = {}

/**
 * Interface used for the External Effect class.
 * @note Any public, non-static properties and functions of the `ExternalEffect`
 * class must first be defined here for them to be accessible to other
 * external-effect-related classes.
 */
export interface TCommonExternalEffect {
  /**
   * The corresponding mission for the external effect.
   */
  get mission(): TCommonMission
  /**
   * The corresponding force for the external effect.
   */
  get force(): TCommonMissionForce
  /**
   * The corresponding node for the external effect.
   */
  get node(): TCommonMissionNode
  /**
   * The corresponding action for the external effect.
   */
  action: TCommonMissionAction
  /**
   * The target to which the external effect will be applied.
   */
  target: TCommonTarget | null
  /**
   * The ID of the external effect.
   */
  _id: string
  /**
   * The name of the external effect.
   */
  name: string
  /**
   * Describes what the external effect does.
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
   * Converts the External Effect Object to JSON.
   * @returns A JSON representation of the Effect.
   */
  toJson: (options?: TExternalEffectJsonOptions) => TCommonExternalEffectJson
}

/**
 * Extracts the external effect type from the mission types.
 * @param T The mission types.
 * @returns The external effect type.
 */
export type TExternalEffect<T extends TCommonMissionTypes> = T['externalEffect']

/**
 * The JSON representation of an External Effect object.
 */
export interface TCommonExternalEffectJson {
  /**
   * The ID of the external effect.
   */
  _id?: string
  /**
   * The name of the external effect.
   */
  name: string
  /**
   * Describes what the external effect does.
   */
  description: string
  /**
   * The current version of the target environment.
   */
  targetEnvironmentVersion: string
  /**
   * The ID of the target to which the external effect will be applied.
   */
  targetId: TCommonTargetJson['_id'] | null
  /**
   * The arguments used to affect the target.
   */
  args: AnyObject
}
