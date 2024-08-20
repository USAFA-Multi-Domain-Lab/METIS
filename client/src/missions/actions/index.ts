import { TClientMissionTypes, TMissionNavigable } from '..'
import MissionAction, {
  TMissionActionOptions,
} from '../../../../shared/missions/actions'
import { TCommonEffectJson } from '../../../../shared/missions/effects'
import { ClientEffect, TClientEffectOptions } from '../effects'

/**
 * Class representing a mission action on the client-side.
 */
export default class ClientMissionAction
  extends MissionAction<TClientMissionTypes>
  implements TMissionNavigable
{
  // Implemented
  public get path(): TMissionNavigable[] {
    return [this.mission, this.force, this.node, this]
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
