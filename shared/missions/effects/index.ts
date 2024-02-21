import { v4 as generateHash } from 'uuid'
import { TCommonTargetEnvironment } from '../../target-environments'
import Target, {
  TCommonTarget,
  TCommonTargetJson,
} from '../../target-environments/targets'
import { TAjaxStatus } from '../../toolbox/ajax'
import { AnyObject } from '../../toolbox/objects'
import { TCommonMissionAction } from '../actions'

/**
 * An effect that can be applied to a target.
 */
export default abstract class Effect<
  TMissionAction extends TCommonMissionAction,
  TTargetEnvironment extends TCommonTargetEnvironment,
> implements TCommonEffect
{
  // Inherited
  public action: TMissionAction

  // Inherited
  public id: TCommonEffect['id']

  // Inherited
  public name: TCommonEffect['name']

  // Inherited
  public description: TCommonEffect['description']

  // Inherited
  public args: TCommonEffect['args']

  /**
   * The target to which the effect will be applied.
   * @note This will be a Target Object if the data has
   * already been loaded. Otherwise, it will be the ID
   * of the target.
   */
  protected _target: Target<TTargetEnvironment> | TCommonTargetJson['id']
  /**
   * The target to which the effect will be applied.
   * @note If the data has not been loaded, this will throw
   * an error.
   */
  public get target(): Target<TTargetEnvironment> {
    if (!(this._target instanceof Target)) {
      throw new Error('Target data for this effect has not been populated.')
    }

    return this._target
  }

  /**
   * The status related to whether the associated target has been loaded.
   */
  protected _targetAjaxStatus: TAjaxStatus
  /**
   * The status related to whether the associated target has been loaded.
   */
  public get targetAjaxStatus(): TAjaxStatus {
    return this._targetAjaxStatus
  }

  /**
   * The ID of the target to which the effect will be applied.
   */
  public get targetId(): TCommonTargetJson['id'] {
    let target: Target<TTargetEnvironment> | TCommonTargetJson['id'] =
      this._target

    // If the target is a Target Object, return its ID.
    if (target instanceof Target) {
      return target.id
    }
    // Otherwise, the target is an ID, so return it.
    else {
      return target
    }
  }
  /**
   * The ID of the target to which the effect will be applied.
   * @note Setting this will cause the target data to be reloaded.
   */
  public set targetId(targetId: TCommonTargetJson['id']) {
    this._target = targetId
    this._targetAjaxStatus = 'NotLoaded'
  }

  /**
   * Creates a new Effect Object.
   * @param {TMissionAction} action The action to which the effect belongs.
   * @param {TCommonEffectJson} data The data to use to create the Effect.
   */
  public constructor(
    action: TMissionAction,
    data: Partial<TCommonEffectJson> = Effect.DEFAULT_PROPERTIES,
    options: TEffectOptions = {},
  ) {
    this.action = action
    this.id = data.id ?? Effect.DEFAULT_PROPERTIES.id
    this.name = data.name ?? Effect.DEFAULT_PROPERTIES.name
    this.description = data.description ?? Effect.DEFAULT_PROPERTIES.description
    this._target = data.targetId ?? Effect.DEFAULT_PROPERTIES.targetId
    this.args = data.args ?? Effect.DEFAULT_PROPERTIES.args

    // Initialize target ajax status.
    this._targetAjaxStatus = 'NotLoaded'

    // If the target data has been provided, load it.
    if (data.targetId) {
      this.populateTargetData(data.targetId)
    }
  }

  /**
   * Populates the target data.
   * @param {TCommonTargetJson['id']} targetId The ID of the target to load.
   * @resolves When the target data has been loaded.
   */
  public abstract populateTargetData(
    targetId: TCommonTargetJson['id'],
  ): Promise<void>

  /**
   * Converts the Effect Object to JSON.
   * @returns {TCommonEffectJson} A JSON representation of the Effect.
   */
  public toJson(): TCommonEffectJson {
    // Construct JSON object to send to the server.
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      targetId: this.target.id,
      args: this.args,
    }
  }

  /**
   * The default properties of the Effect.
   */
  public static readonly DEFAULT_PROPERTIES: Required<TCommonEffectJson> = {
    id: generateHash(),
    name: undefined,
    description: undefined,
    targetId: Target.DEFAULT_PROPERTIES.id,
    args: {},
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
 */
export interface TCommonEffect {
  /**
   * The action to which the effect belongs.
   */
  action: TCommonMissionAction
  /**
   * The target to which the effect will be applied.
   */
  target: TCommonTarget
  /**
   * The ID of the effect.
   */
  id: string
  /**
   * The name of the effect.
   */
  name: string | undefined
  /**
   * Descibes what the effect does.
   */
  description: string | undefined
  /**
   * The arguments used to affect an entity via the effects API.
   */
  args: AnyObject
  /**
   * Converts the Effect Object to JSON.
   */
  toJson: (options?: TEffectJsonOptions) => TCommonEffectJson
}

/**
 * The JSON representation of an Effect object.
 */
export interface TCommonEffectJson {
  /**
   * The ID of the effect.
   */
  id: string
  /**
   * The name of the effect.
   */
  name: string | undefined
  /**
   * Descibes what the effect does.
   */
  description: string | undefined
  /**
   * The ID of the target to which the effect will be applied.
   */
  targetId: TCommonTargetJson['id']
  /**
   * The arguments used to affect an entity via the effects API.
   */
  args: AnyObject
}
