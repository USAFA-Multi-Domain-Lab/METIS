import { v4 as generateHash } from 'uuid'
import { TCommonTargetEnv } from '../../target-environments'
import Target, {
  TCommonTarget,
  TCommonTargetJson,
} from '../../target-environments/targets'
import { AnyObject } from '../../toolbox/objects'
import { TCommonMissionAction } from '../actions'

/**
 * An effect that can be applied to a target.
 */
export default abstract class Effect<
  TMissionAction extends TCommonMissionAction,
  TTargetEnvironment extends TCommonTargetEnv,
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
  public targetEnvironmentVersion: TCommonEffect['targetEnvironmentVersion']

  // Inherited
  public args: TCommonEffect['args']

  /**
   * The target to which the effect will be applied.
   * @note This will be a Target Object if the data has
   * already been loaded. Otherwise, it will be the ID
   * of the target. If the target is not set, it will be
   * null.
   */
  protected _target: Target<TTargetEnvironment> | TCommonTargetJson['id'] | null
  /**
   * The target to which the effect will be applied.
   */
  public get target(): Target<TTargetEnvironment> | null {
    if (!(this._target instanceof Target)) {
      this._target = null
    }

    return this._target
  }
  /**
   * The target to which the effect will be applied.
   * @note Setting this will cause the target data to be reloaded.
   */
  public set target(
    target: Target<TTargetEnvironment> | TCommonTargetJson['id'] | null,
  ) {
    // If the target is a Target Object, set it.
    if (target instanceof Target) {
      this._target = target
    }
    // Or, the target is an ID.
    else if (typeof target === 'string') {
      this._target = target
    }
    // Otherwise, set the target to null.
    else {
      this._target = null
    }
  }

  /**
   * The ID of the target to which the effect will be applied.
   */
  public get targetId(): TCommonTargetJson['id'] | null {
    let target: Target<TTargetEnvironment> | TCommonTargetJson['id'] | null =
      this._target

    // If the target is a Target Object, return its ID.
    if (target instanceof Target) {
      return target.id
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
  public set targetId(targetId: TCommonTargetJson['id']) {
    this._target = targetId
  }

  /**
   * The environment in which the target exists.
   */
  public get targetEnvironment(): TTargetEnvironment | null {
    if (this.target instanceof Target) {
      return this.target.targetEnvironment
    } else {
      return null
    }
  }

  /**
   * The node on which the action is being executed.
   */
  public get node(): TCommonMissionAction['node'] {
    return this.action.node
  }

  /**
   * The mission of which the action is a part.
   */
  public get mission(): TCommonMissionAction['mission'] {
    return this.action.mission
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
    this.targetEnvironmentVersion =
      data.targetEnvironmentVersion ??
      Effect.DEFAULT_PROPERTIES.targetEnvironmentVersion
    this._target = data.targetId ?? Effect.DEFAULT_PROPERTIES.targetId
    this.args = data.args ?? Effect.DEFAULT_PROPERTIES.args

    // If the target data has been provided and
    // it's not the default target ID, then populate
    // the target data.
    if (data.targetId && data.targetId !== null) {
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
      targetEnvironmentVersion: this.targetEnvironmentVersion,
      targetId: this.target ? this.target.id : this.targetId,
      args: this.args,
    }
  }

  /**
   * Default properties set when creating a new Effect object.
   */
  public static get DEFAULT_PROPERTIES(): TCommonEffectJson {
    return {
      id: generateHash(),
      name: 'New Effect',
      description: '<p><br></p>',
      targetEnvironmentVersion: '0.0.1',
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
 */
export interface TCommonEffect {
  /**
   * The action to which the effect belongs.
   */
  action: TCommonMissionAction
  /**
   * The target to which the effect will be applied.
   */
  target: TCommonTarget | null
  /**
   * The ID of the effect.
   */
  id: string
  /**
   * The name of the effect.
   */
  name: string
  /**
   * Descibes what the effect does.
   */
  description: string
  /**
   * The current version of the target environment.
   */
  targetEnvironmentVersion: string
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
  name: string
  /**
   * Descibes what the effect does.
   */
  description: string
  /**
   * The current version of the target environment.
   */
  targetEnvironmentVersion: string
  /**
   * The ID of the target to which the effect will be applied.
   */
  targetId: TCommonTargetJson['id'] | null
  /**
   * The arguments used to affect an entity via the effects API.
   */
  args: AnyObject
}
