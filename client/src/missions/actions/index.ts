import { TMetisClientComponents } from 'src'
import { TCreateJsonType } from '../../../../shared'
import MissionAction, {
  TMissionActionJson,
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
   * @param options The options for duplicating the action.
   * @param options.node The node to which the duplicated action belongs.
   * @param options.name The name of the duplicated action.
   * @param options.localKey The local key of the duplicated action.
   * @returns A new action with the same properties as this one or with the
   * provided properties.
   */
  public duplicate(options: TDuplicateActionOptions = {}): ClientMissionAction {
    // Gather details.
    const {
      node = this.node,
      name = this.name,
      localKey = this.localKey,
    } = options

    let duplicatedAction = new ClientMissionAction(node, {
      name,
      localKey,
      _id: ClientMissionAction.DEFAULT_PROPERTIES._id,
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
      effects: [],
    })

    // Duplicate the effects.
    duplicatedAction.effects = this.effects.map((effect) =>
      effect.duplicate({ action: duplicatedAction }),
    )

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
 * @see {@link TMissionActionJson}
 */
type TClientMissionActionJson = TCreateJsonType<
  ClientMissionAction,
  TMissionActionJsonDirect,
  TMissionActionJsonIndirect
>

/**
 * The options for duplicating an action.
 * @see {@link ClientMissionAction.duplicate}
 */
type TDuplicateActionOptions = {
  /**
   * The node to which the duplicated action belongs.
   */
  node?: ClientMissionNode
  /**
   * The name of the duplicated action.
   */
  name?: string
  /**
   * The local key of the duplicated action.
   */
  localKey?: string
}
