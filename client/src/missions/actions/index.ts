import ClientMission from '..'
import MissionAction from '../../../../shared/missions/actions'
import { TCommonEffectJson } from '../../../../shared/missions/effects'
import ClientMissionNode from '../nodes'
import { ClientEffect } from '../effects'

/**
 * Class representing a mission action on the client-side.
 */
export default class ClientMissionAction extends MissionAction<
  ClientMission,
  ClientMissionNode,
  ClientEffect
> {
  public parseEffects(data: TCommonEffectJson[]): ClientEffect[] {
    return data.map((datum: TCommonEffectJson) => new ClientEffect(this, datum))
  }
}

/* ------------------------------ CLIENT ACTION TYPES ------------------------------ */
