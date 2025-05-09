import { TMetisClientComponents } from 'src'
import { TCreateJsonType } from '../../../../shared'
import MissionAction, {
  TMissionActionJsonDirect,
  TMissionActionJsonIndirect,
} from '../../../../shared/missions/actions'
import { TEffectJson } from '../../../../shared/missions/effects'
import { ClientEffect } from '../effects'
import ClientMissionNode from '../nodes'

/**
 * Class representing a mission action on the client-side.
 */
export default class ClientMissionAction extends MissionAction<TMetisClientComponents> {
  /**
   * The formatted success chance to display to a session
   * member.
   */
  public get successChanceFormatted(): string {
    // If the success chance is hidden, return `HIDDEN_VALUE`.
    if (this.successChanceHidden) return ClientMissionAction.HIDDEN_VALUE
    // Convert the value to a percentage format.
    return `${this.successChance * 100}%`
  }

  /**
   * The formatted process time to display to a session
   * member.
   */
  public get processTimeFormatted(): string {
    // If the process time is hidden, return the hidden
    // value.
    if (this.processTimeHidden) return ClientMissionAction.HIDDEN_VALUE
    // Convert the value to a seconds format.
    return `${this.processTime / 1000}s`
  }

  /**
   * The formatted resource cost to display to a session
   * member.
   */
  public get resourceCostFormatted(): string {
    // If the resource cost is hidden, return `HIDDEN_VALUE`.
    if (this.resourceCostHidden) return ClientMissionAction.HIDDEN_VALUE
    // Convert the value to a negative format.
    return `${-this.resourceCost} ${this.mission.resourceLabel}`
  }

  /**
   * The formatted opens node property to display to a
   * session member.
   */
  public get opensNodeFormatted(): string {
    // If the opens node is hidden, return `HIDDEN_VALUE`.
    if (this.opensNodeHidden) return ClientMissionAction.HIDDEN_VALUE
    // Return 'Yes' if the value is true, otherwise 'No'.
    return this.opensNode ? 'Yes' : 'No'
  }

  /**
   * The default properties for a duplcated action.
   */
  private readonly _defaultDuplicateProperties: TActionDuplicateParams = {
    node: this.node,
    _id: ClientMissionAction.DEFAULT_PROPERTIES._id,
    name: this.name,
    description: this.description,
    processTime: this.processTime,
    processTimeHidden: this.processTimeHidden,
    successChance: this.successChance,
    successChanceHidden: this.successChanceHidden,
    resourceCost: this.resourceCost,
    resourceCostHidden: this.resourceCostHidden,
    opensNode: this.opensNode,
    opensNodeHidden: this.opensNodeHidden,
    postExecutionSuccessText: this.postExecutionSuccessText,
    postExecutionFailureText: this.postExecutionFailureText,
    localKey: this.localKey,
    effects: [],
  }

  /**
   * @param node The node that the action belongs to.
   * @param data The action data from which to create the action.
   *  @note Any ommitted values will be set to their default properties
   *  defined in `ClientMissionAction.DEFAULT_PROPERTIES`.
   */
  public constructor(
    node: ClientMissionNode,
    data: Partial<TClientMissionActionJson> = ClientMissionAction.DEFAULT_PROPERTIES,
  ) {
    super(node, data)
  }

  // Implemented
  protected parseEffects(data: TEffectJson[]): ClientEffect[] {
    return data.map((datum: TEffectJson) => new ClientEffect(this, datum))
  }

  /**
   * Duplicates the action, creating a new action with the same properties
   * as this one or with the provided properties.
   * @returns A new action with the same properties as this one or with the
   * provided properties.
   * @note **Any properties provided will override using the properties from
   * the action that is being duplicated.**
   * @note ***The effects are cleanly duplicated, meaning that the new action
   * will have its own set of effects with their own unique IDs. The effect
   * arguments will also be handled correctly.***
   * @default node = originalAction.node
   * @default _id = ClientMissionAction.DEFAULT_PROPERTIES._id // generates a new UUID
   * @default name = originalAction.name
   * @default description = originalAction.description
   * @default processTime = originalAction.processTime
   * @default processTimeHidden = originalAction.processTimeHidden
   * @default successChance = originalAction.successChance
   * @default successChanceHidden = originalAction.successChanceHidden
   * @default resourceCost = originalAction.resourceCost
   * @default resourceCostHidden = originalAction.resourceCostHidden
   * @default opensNode = originalAction.opensNode
   * @default opensNodeHidden = originalAction.opensNodeHidden
   * @default postExecutionSuccessText = originalAction.postExecutionSuccessText
   * @default postExecutionFailureText = originalAction.postExecutionFailureText
   * @default localKey = originalAction.localKey
   * @default effects = undefined // indicates that the effects need to be properly duplicated also
   * @example
   * const newAction = action.duplicate({
   *   node: newNode, // This will be the duplicated action's new node.
   *   _id: 'new-action-id', // This will be the duplicated action's new ID.
   *   name: 'New Action', // This will be the duplicated action's new name.
   *   description: 'New Action Description', // This will be the duplicated action's new description.
   *   processTime: 1000, // This will be the duplicated action's new process time.
   *   processTimeHidden: false, // This will be the duplicated action's new process time hidden value.
   *   successChance: 0.5, // This will be the duplicated action's new success chance.
   *   successChanceHidden: false, // This will be the duplicated action's new success chance hidden value.
   *   resourceCost: 100, // This will be the duplicated action's new resource cost.
   *   resourceCostHidden: false, // This will be the duplicated action's new resource cost hidden value.
   *   opensNode: true, // This will be the duplicated action's new opens node value.
   *   opensNodeHidden: false, // This will be the duplicated action's new opens node hidden value.
   *   postExecutionSuccessText: 'New Action Success Text', // This will be the duplicated action's new post execution success text.
   *   postExecutionFailureText: 'New Action Failure Text', // This will be the duplicated action's new post execution failure text.
   *   localKey: 'new-action-local-key', // This will be the duplicated action's new local key.
   *   effects: [], // This will be what the effect data is set as for the duplicated action.
   * })
   * @example
   * // If no properties are provided, the duplicated action will
   * // have the same properties as the original action except for
   * // the ID and the effects. The ID will be generated using
   * // `ClientMissionAction.DEFAULT_PROPERTIES._id` and the effects
   * // will be duplicated using the `duplicate` method of the
   * // `ClientEffect` class. See the default property values
   * // above for more information.
   * const newAction = action.duplicate()
   */
  public duplicate(
    {
      node = this._defaultDuplicateProperties.node,
      _id = this._defaultDuplicateProperties._id,
      name = this._defaultDuplicateProperties.name,
      description = this._defaultDuplicateProperties.description,
      processTime = this._defaultDuplicateProperties.processTime,
      processTimeHidden = this._defaultDuplicateProperties.processTimeHidden,
      successChance = this._defaultDuplicateProperties.successChance,
      successChanceHidden = this._defaultDuplicateProperties
        .successChanceHidden,
      resourceCost = this._defaultDuplicateProperties.resourceCost,
      resourceCostHidden = this._defaultDuplicateProperties.resourceCostHidden,
      opensNode = this._defaultDuplicateProperties.opensNode,
      opensNodeHidden = this._defaultDuplicateProperties.opensNodeHidden,
      postExecutionSuccessText = this._defaultDuplicateProperties
        .postExecutionSuccessText,
      postExecutionFailureText = this._defaultDuplicateProperties
        .postExecutionFailureText,
      localKey = this._defaultDuplicateProperties.localKey,
      effects = this._defaultDuplicateProperties.effects,
    }: TActionDuplicateArgs = this._defaultDuplicateProperties,
  ): ClientMissionAction {
    let duplicatedAction = new ClientMissionAction(node, {
      _id,
      name,
      description,
      processTime,
      processTimeHidden,
      successChance,
      successChanceHidden,
      resourceCost,
      resourceCostHidden,
      opensNode,
      opensNodeHidden,
      postExecutionSuccessText,
      postExecutionFailureText,
      localKey,
      effects,
    })

    // Duplicate the effects, if necessary.
    if (effects.length === 0) {
      duplicatedAction.effects = this.effects.map((effect) =>
        effect.duplicate({ action: duplicatedAction }),
      )
    }

    return duplicatedAction
  }

  /**
   * Display for an action property that is hidden
   * from the user.
   */
  public static readonly HIDDEN_VALUE: string = '???'
}

/* ------------------------------ CLIENT ACTION TYPES ------------------------------ */

/**
 * Plain JSON representation of a `MissionAction` object.
 * @note This is a carbon copy of the `TMissionActionJson` type
 * from the shared library and is used to temporarily fix the
 * any issue that happens when importing from the shared
 * library.
 * @see /shared/missions/actions/index.ts
 */
type TClientMissionActionJson = TCreateJsonType<
  ClientMissionAction,
  TMissionActionJsonDirect,
  TMissionActionJsonIndirect
>

/**
 * The arguments used to duplicate an action.
 */
type TActionDuplicateArgs = Partial<TClientMissionActionJson> & {
  /**
   * The node that the duplicated action will belong to.
   * @default originalAction.node
   */
  node?: ClientMissionNode
}

/**
 * The parameters used to duplicate an action.
 */
type TActionDuplicateParams = TClientMissionActionJson & {
  /**
   * The node that the duplicated action will belong to.
   * @default originalAction.node
   */
  node: ClientMissionNode
}
