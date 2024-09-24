import { TClientMissionTypes, TMissionComponent, TMissionNavigable } from '..'
import MissionAction, {
  TCommonMissionActionJson,
  TMissionActionOptions,
} from '../../../../shared/missions/actions'
import { TCommonEffectJson } from '../../../../shared/missions/effects'
import { ClientEffect, TClientEffectOptions } from '../effects'
import ClientMissionNode from '../nodes'

/**
 * Class representing a mission action on the client-side.
 */
export default class ClientMissionAction
  extends MissionAction<TClientMissionTypes>
  implements TMissionComponent
{
  // Implemented
  public get path(): TMissionNavigable[] {
    return [this.mission, this.force, this.node, this]
  }
  /**
   * The message to display when the action is defective.
   */
  private _defectiveMessage: string
  /**
   * The message to display when the action is defective.
   */
  public get defectiveMessage(): string {
    return this._defectiveMessage
  }

  /**
   * @param node The node on which the action is being executed.
   * @param data The action data from which to create the action. Any ommitted values will be set to the default properties defined in MissionAction.DEFAULT_PROPERTIES.
   * @param options The options for creating the action.
   */
  public constructor(
    node: ClientMissionNode,
    data: Partial<TCommonMissionActionJson> = ClientMissionAction.DEFAULT_PROPERTIES,
    options: TClientMissionActionOptions = {},
  ) {
    super(node, data, options)
    this._defectiveMessage = ''
  }
  /**
   * Evaluates if the action is defective or not.
   * @returns boolean indicating if the action is defective or not.
   */
  public isDefective(): boolean {
    return false
  }

  // Implemented
  protected parseEffects(
    data: TCommonEffectJson[],
    options: TClientEffectOptions = {},
  ): ClientEffect[] {
    return data.map(
      (datum: TCommonEffectJson) => new ClientEffect(this, datum, options),
    )
  }
}

/* ------------------------------ CLIENT ACTION TYPES ------------------------------ */

/**
 * Options for creating a new ClientMissionAction object.
 */
export type TClientMissionActionOptions = TMissionActionOptions & {}
