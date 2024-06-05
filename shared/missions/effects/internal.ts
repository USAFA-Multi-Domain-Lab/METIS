import { v4 as generateHash } from 'uuid'
import { TCommonMissionAction } from '../actions'
import MissionNode, { TCommonMissionNode } from '../nodes'

/**
 * Represents an internal effect that happens in METIS during a session.
 */
export default abstract class InternalEffect<
  TMissionAction extends TCommonMissionAction,
> implements TCommonInternalEffect
{
  // Inherited
  action: TMissionAction

  // Inherited
  _id: TCommonInternalEffect['_id']

  // Inherited
  name: TCommonInternalEffect['name']

  // Inherited
  description: TCommonInternalEffect['description']

  /**
   * The target to which the internal effect will be applied.
   */
  protected _target: TCommonInternalEffect['target'] | null
  /**
   * The target to which the internal effect will be applied.
   */
  public get target(): TCommonInternalEffect['target'] | null {
    if (this._target !== null) {
      if (
        this._target.key === 'node' &&
        !(this._target.node instanceof MissionNode)
      ) {
        this._target = null
      }
      // else if (this._target.key === 'output' && !(this._target.force instanceof Force)) {
      //   this._target = null
      // }
    }

    return this._target
  }
  /**
   * The target to which the internal effect will be applied.
   */
  public set target(target: TCommonInternalEffect['target'] | null) {
    // if (target !== null) {
    //   if (target.key === 'node' && target.node instanceof MissionNode) {
    //     this._target = target
    //   }
    //   // else if (target.key === 'output' && target.force instanceof Force) {
    //   //   this._target = target
    //   // }
    //   else {
    //     this._target = null
    //   }
    // }
    this._target = target
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
    this._id = data._id ?? InternalEffect.DEFAULT_PROPERTIES._id
    this.name = data.name ?? InternalEffect.DEFAULT_PROPERTIES.name
    this.description =
      data.description ?? InternalEffect.DEFAULT_PROPERTIES.description
    this._target = data.target ?? InternalEffect.DEFAULT_PROPERTIES.target
  }

  /**
   * Populates the target data.
   * @param target The target data to load.
   * @resolves When the target data has been loaded.
   * @rejects If there is an error loading the target data.
   */
  public abstract populateTargetData(target: TInternalTarget): Promise<void>

  /**
   * Converts the Internal Effect Object to JSON.
   * @param options The options for converting the Internal Effect Object to JSON.
   */
  public toJson(): TCommonInternalEffectJson {
    return {
      _id: this._id,
      name: this.name,
      description: this.description,
      target: this.target
        ? this.target
        : InternalEffect.DEFAULT_PROPERTIES.target,
    }
  }

  /**
   * The default properties set when creating a new Internal Effect Object.
   */
  public static get DEFAULT_PROPERTIES(): Required<TCommonInternalEffectJson> {
    return {
      _id: generateHash(),
      name: 'New Effect',
      description: '<p><br></p>',
      target: {
        key: 'default',
        name: 'Select a target',
      },
    }
  }

  /**
   * The available targets to which the internal effect can be applied.
   */
  public static AVAILABLE_TARGETS: TInternalTarget[] = [
    {
      key: 'node',
      name: 'Node',
      node: '',
      disableNode: false,
      successChance: 0,
      processTime: 0,
      resourceCost: 0,
    },
    {
      key: 'output',
      name: 'Output Panel',
      // force: '',
      message: '',
    },
  ]
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

type TDefaultTarget = {
  /**
   * The key for the target type.
   */
  key: 'default'
  /**
   * The name of the target type.
   */
  name: 'Select a target'
}

/**
 * Target type used for creating an internal effect.
 */
type TNodeTarget = {
  /**
   * The key for the target type.
   */
  key: 'node'
  /**
   * The name of the target type.
   */
  name: 'Node'
  /**
   * The node to affect.
   */
  node: TCommonMissionNode | TCommonMissionNode['_id']
  /**
   * Whether to disable the node after the action is executed.
   */
  disableNode: boolean
  /**
   * How much to increase/decrease the success chance by for all the node's actions.
   */
  successChance: TCommonMissionAction['successChance']
  /**
   * How much to increase/decrease the process time by for all the node's actions.
   */
  processTime: TCommonMissionAction['processTime']
  /**
   * How much to increase/decrease the resource cost by for all the node's actions.
   */
  resourceCost: TCommonMissionAction['resourceCost']
}

/**
 * Target type used for creating an internal effect.
 */
type TOutputTarget = {
  /**
   * The key for the target type.
   */
  key: 'output'
  /**
   * The name of the target type.
   */
  name: 'Output Panel'
  /**
   * The force where the output panel is located.
   */
  // force: TCommonMissionForce | TCommonMissionForce['_id']
  /**
   * The message to send to the output panel.
   */
  message: string
}

/**
 * The target type used for creating an internal effect.
 */
export type TInternalTarget = TNodeTarget | TOutputTarget | TDefaultTarget

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
   * The target to which the internal effect will be applied.
   */
  target: TInternalTarget | null
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
   * The target to which the internal effect will be applied.
   */
  target: TInternalTarget
}
