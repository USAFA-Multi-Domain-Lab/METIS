import { TClientMissionTypes, TMissionNavigable } from '..'
import MissionAction from '../../../../shared/missions/actions'
import { TCommonEffectJson } from '../../../../shared/missions/effects'
import { ClientEffect } from '../effects'

/**
 * Class representing a mission action on the client-side.
 */
export default class ClientMissionAction
  extends MissionAction<TClientMissionTypes>
  implements TMissionNavigable
{
  public get path(): TMissionNavigable[] {
    return [this.mission, this.force, this.node, this]
  }

  // Implemented
  public parseEffects(data: TCommonEffectJson[]): ClientEffect[] {
    return data.map((datum: TCommonEffectJson) => new ClientEffect(this, datum))
  }
}
