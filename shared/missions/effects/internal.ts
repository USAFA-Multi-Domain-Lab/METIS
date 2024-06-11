import { v4 as generateHash } from 'uuid'
import { TCommonMission } from '..'
import { TCommonTargetEnv } from '../../target-environments'
import Target, {
  TCommonTarget,
  TCommonTargetJson,
} from '../../target-environments/targets'
import { AnyObject } from '../../toolbox/objects'
import { uuidTypeValidator } from '../../toolbox/validators'
import { TCommonMissionAction } from '../actions'
import IActionExecution from '../actions/executions'
import IActionOutcome from '../actions/outcomes'
import MissionNode, { TCommonMissionNode } from '../nodes'

/**
 * Represents an internal effect that happens in METIS during a session.
 */
export default abstract class InternalEffect<
  TMission extends TCommonMission,
  TRelativeNode extends TCommonMissionNode,
  TMissionAction extends TCommonMissionAction,
  TActionExecution extends IActionExecution,
  TActionOutcome extends IActionOutcome,
  TTargetEnvironment extends TCommonTargetEnv,
  // todo: uncomment when force is implemented
  // TMissionForce extends TCommonMissionForce,
> implements TCommonInternalEffect
{
  // Inherited
  public action: TMissionAction

  // Inherited
  public _id: TCommonInternalEffect['_id']

  // Inherited
  public name: TCommonInternalEffect['name']

  // Inherited
  public description: TCommonInternalEffect['description']

  // Inherited
  public args: TCommonInternalEffect['args']

  /**
   * The target to which the external effect will be applied.
   * @note This will be a Target Object if the data has
   * already been loaded. Otherwise, it will be the ID
   * of the target. If the target is not set, it will be
   * null.
   */
  protected _target:
    | Target<TTargetEnvironment>
    | TCommonTargetJson['_id']
    | null
  /**
   * The target to which the external effect will be applied.
   */
  public get target(): Target<TTargetEnvironment> | null {
    if (!(this._target instanceof Target)) {
      this._target = null
    }

    return this._target
  }
  /**
   * The target to which the external effect will be applied.
   * @note Setting this will cause the target data to be reloaded.
   */
  public set target(
    target: Target<TTargetEnvironment> | TCommonTargetJson['_id'] | null,
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
   * The ID of the target to which the external effect will be applied.
   */
  public get targetId(): TCommonTargetJson['_id'] | null {
    let target: Target<TTargetEnvironment> | TCommonTargetJson['_id'] | null =
      this._target

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
      return InternalEffect.DEFAULT_PROPERTIES.targetId
    }
  }
  /**
   * The ID of the target to which the external effect will be applied.
   */
  public set targetId(targetId: TCommonTargetJson['_id']) {
    this._target = targetId
  }

  /**
   * The necessary parameters to apply the internal effect
   * to the target.
   *
   * @note The current parameters for an internal effect's target can
   * only be a `Mission Node Object` or a `Mission Force Object`
   * depending on what the target's ID is.
   *
   * If the target's ID is 'node', then the parameter will be
   * a `Mission Node Object`. If the target's ID is 'output', then
   * the parameter will be a `Mission Force Object`.
   */
  protected _targetParams:
    | MissionNode<
        TMission,
        TRelativeNode,
        TMissionAction,
        TActionExecution,
        TActionOutcome
      >
    | string
    | null
  // todo: uncomment when force is implemented
  // | MissionForce<>
  /**
   * The necessary parameters to apply the internal effect
   * to the target.
   */
  public get targetParams(): MissionNode<
    TMission,
    TRelativeNode,
    TMissionAction,
    TActionExecution,
    TActionOutcome
  > | null {
    // | TMissionForce<> // todo: uncomment when force is implemented
    if (
      !(this._targetParams instanceof MissionNode)
      // todo: uncomment when force is implemented
      // && !(this._targetParams instanceof MissionForce)
    ) {
      this._targetParams = null
    }

    return this._targetParams
  }
  /**
   * The necessary parameters to apply the internal effect
   * to the target.
   * @note Setting this will cause the target parameter's data to be reloaded.
   */
  public set targetParams(
    targetParams:
      | MissionNode<
          TMission,
          TRelativeNode,
          TMissionAction,
          TActionExecution,
          TActionOutcome
        >
      | string
      | null,
  ) {
    // If the target's parameter(s) is a Mission Node Object
    // or a Mission Force Object, set it.
    if (
      targetParams instanceof MissionNode
      // todo: uncomment when force is implemented
      // || targetParams instanceof MissionForce
    ) {
      this._targetParams = targetParams
    }
    // Or, if the target's parameter(s) is an ID.
    else if (typeof targetParams === 'string') {
      this._targetParams = targetParams
    }
    // Otherwise, set the target's parameter(s) to null.
    else {
      this._targetParams = null
    }
  }

  /**
   * The necessary parameters to apply the internal effect
   * to the target.
   */
  public get targetParamsId():
    | TCommonInternalEffectJson['targetParamsId']
    | null {
    let targetParams = this._targetParams

    // If the target's parameter(s) is a Mission Node Object
    // or a Mission Force Object, return its ID.
    if (
      targetParams instanceof MissionNode
      // todo: uncomment when force is implemented
      // || targetParams instanceof MissionForce
    ) {
      return targetParams._id
    }
    // Or, if the target's parameter(s) is an ID.
    else if (typeof targetParams === 'string') {
      return targetParams
    }
    // Otherwise, return the target parameter's default ID.
    else {
      return InternalEffect.DEFAULT_PROPERTIES.targetParamsId
    }
  }
  /**
   * The necessary parameters to apply the internal effect
   * to the target.
   */
  public set targetParamsId(
    targetParamsId: TCommonInternalEffectJson['targetParamsId'],
  ) {
    this._targetParams = targetParamsId
  }

  /**
   * The node on which the action is being executed.
   */
  public get node(): TMissionAction['node'] {
    return this.action.node
  }

  /**
   * The mission of which the action is a part.
   */
  public get mission(): TMissionAction['mission'] {
    return this.action.mission
  }

  // todo: uncomment when force is implemented
  // /**
  //  * The force that this internal effect belongs to.
  //  */
  // public get force(): TMissionAction['force'] {
  //   return this.action.force
  // }

  // todo: uncomment when force is implemented
  // /**
  //  * The force that the internal effect's target belongs to.
  //  */
  // public get targetForce(): TMissionAction['force'] {
  //   if (this.targetParams && this.targetParams instanceof MissionNode) {
  //     return this.targetParams.force
  //   } else if (this.targetParams && this.targetParams instanceof MissionForce) {
  //     return this.targetParams
  //   }
  // }

  /**
   * Creates a new Internal Effect Object.
   * @param action The action to which the internal effect belongs.
   * @param data The JSON data to use when creating the internal effect.
   * @param options The options for creating the internal effect.
   */
  constructor(
    action: TMissionAction,
    data: Partial<TCommonInternalEffectJson> = InternalEffect.DEFAULT_PROPERTIES,
    options: TInternalEffectOptions = {},
  ) {
    this.action = action
    this._id = data._id?.toString() ?? InternalEffect.DEFAULT_PROPERTIES._id
    this.name = data.name ?? InternalEffect.DEFAULT_PROPERTIES.name
    this.description =
      data.description ?? InternalEffect.DEFAULT_PROPERTIES.description
    this.args = data.args ?? InternalEffect.DEFAULT_PROPERTIES.args
    this._target = data.targetId ?? InternalEffect.DEFAULT_PROPERTIES.targetId
    this._targetParams =
      data.targetParamsId ?? InternalEffect.DEFAULT_PROPERTIES.targetParamsId

    // If the target data has been provided and
    // it's not the default target ID, then populate
    // the target data.
    if (data.targetId) {
      this.populateTargetData(data.targetId)
    }

    // If the args data has been provided and
    // it's not the default arg ID, then populate
    // the args data.
    if (data.targetParamsId) {
      this.populateTargetParamsData(data.targetParamsId)
    }
  }

  // Inherited
  public abstract populateTargetData(
    targetId: TCommonTargetJson['_id'],
  ): Promise<void>

  // Inherited
  public abstract populateTargetParamsData(
    argId: TCommonMissionNode['_id'],
  ): // todo: uncomment when force is implemented
  // | TCommonMissionForce['_id'],
  Promise<void>

  /**
   * Converts the Internal Effect Object to JSON.
   * @param options The options for converting the Internal Effect Object to JSON.
   */
  public toJson(): TCommonInternalEffectJson {
    // Construct JSON object to send to the server.
    let json: TCommonInternalEffectJson = {
      name: this.name,
      description: this.description,
      args: this.args,
      targetId: this.target ? this.target._id : this.targetId,
      targetParamsId: this.targetParams
        ? this.targetParams._id
        : this.targetParams,
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
   * The default properties set when creating a new Internal Effect Object.
   */
  public static get DEFAULT_PROPERTIES(): Required<TCommonInternalEffectJson> {
    return {
      _id: generateHash(),
      name: 'New Effect',
      description: '<p><br></p>',
      args: {},
      targetId: null,
      targetParamsId: null,
    }
  }
}

/* ---------------------------- TYPES FOR EFFECTS ---------------------------- */

/**
 * Options for creating a new Internal Effect Object.
 */
type TInternalEffectOptions = {}

/**
 * Options for converting an Internal Effect Object to JSON.
 */
type TInternalEffectJsonOptions = {}

/**
 * Object representing an internal effect in a mission.
 */
export type TCommonInternalEffect = {
  /**
   * The action to which the internal effect belongs.
   */
  action: TCommonMissionAction
  /**
   * The ID of the internal effect.
   */
  _id: string
  /**
   * The name of the internal effect.
   */
  name: string
  /**
   * Describes what the internal effect does.
   */
  description: string
  /**
   * The arguments used to affect the target.
   */
  args: AnyObject
  /**
   * The target to which the internal effect will be applied.
   */
  target: TCommonTarget | null
  /**
   * The necessary parameters to apply the internal effect
   * to the target.
   *
   * @note The current parameters for an internal effect's target can
   * only be a `Mission Node Object` or a `Mission Force Object`
   * depending on what the target's ID is.
   *
   * If the target's ID is 'node', then the parameter will be
   * a `Mission Node Object`. If the target's ID is 'output', then
   * the parameter will be a `Mission Force Object`.
   */
  targetParams: TCommonMissionNode | null
  // todo: uncomment when force is implemented
  // | TCommonMissionForce
  /**
   * Populates the target data.
   * @param targetId The ID of the target to load.
   * @resolves When the target data has been loaded.
   * @rejects If there is an error loading the target data.
   */
  populateTargetData: (targetId: TCommonTargetJson['_id']) => Promise<void>
  /**
   * Populates the target parameter's data.
   * @param targetParamsId The ID of the target parameter to load.
   * @resolves When the target parameter's data has been loaded.
   * @rejects If there is an error loading the target parameter's data.
   */
  populateTargetParamsData: (
    targetParamsId: TCommonMissionNode['_id'],
  ) => Promise<void>
  /**
   * Converts the Internal Effect Object to JSON.
   */
  toJson: (options?: TInternalEffectJsonOptions) => TCommonInternalEffectJson
}

/**
 * JSON representation of an internal effect in a mission.
 */
export type TCommonInternalEffectJson = {
  /**
   * The ID of the internal effect.
   */
  _id?: string
  /**
   * The name of the internal effect.
   */
  name: string
  /**
   * Describes what the internal effect does.
   */
  description: string
  /**
   * The arguments used to affect the target.
   */
  args: AnyObject
  /**
   * The target to which the internal effect will be applied.
   */
  targetId: TCommonTargetJson['_id'] | null
  /**
   * The ID of the target's parameter that's used to apply the internal effect
   * to the target.
   *
   * @note The current parameter's ID for an internal effect's target can
   * only be a `Mission Node's` ID or a `Mission Force's` ID
   * depending on what the target's ID is.
   *
   * If the target's ID is 'node', then the parameter's ID will be
   * the `Mission Node's` ID. If the target's ID is 'output', then
   * the parameter's ID will be the `Mission Force's` ID.
   */
  targetParamsId: TCommonMissionNode['_id'] | null
  // todo: uncomment when force is implemented
  // | TCommonMissionForce['_id']
}
