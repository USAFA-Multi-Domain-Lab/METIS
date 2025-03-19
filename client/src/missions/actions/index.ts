import { TMetisClientComponents } from 'src'
import MissionAction, {
  TMissionActionJson,
  TMissionActionOptions,
} from '../../../../shared/missions/actions'
import { TEffectJson } from '../../../../shared/missions/effects'
import { ClientEffect, TClientEffectOptions } from '../effects'
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
   * @param node The node on which the action is being executed.
   * @param data The action data from which to create the action. Any ommitted values will be set to the default properties defined in MissionAction.DEFAULT_PROPERTIES.
   * @param options The options for creating the action.
   */
  public constructor(
    node: ClientMissionNode,
    data: Partial<TMissionActionJson> = ClientMissionAction.DEFAULT_PROPERTIES,
    options: TClientMissionActionOptions = {},
  ) {
    super(node, data, options)
  }

  // Implemented
  protected parseEffects(
    data: TEffectJson[],
    options: TClientEffectOptions = {},
  ): ClientEffect[] {
    return data.map(
      (datum: TEffectJson) => new ClientEffect(this, datum, options),
    )
  }

  /**
   * Display for an action property that is hidden
   * from the user.
   */
  public static readonly HIDDEN_VALUE: string = '???'
}

/* ------------------------------ CLIENT ACTION TYPES ------------------------------ */

/**
 * Options for creating a new ClientMissionAction object.
 */
export type TClientMissionActionOptions = TMissionActionOptions & {}
