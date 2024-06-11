import ClientMission from '..'
import MissionAction from '../../../../shared/missions/actions'
import { TCommonExternalEffectJson } from '../../../../shared/missions/effects/external'
import { TCommonInternalEffectJson } from '../../../../shared/missions/effects/internal'
import { ClientExternalEffect } from '../effects/external'
import { ClientInternalEffect } from '../effects/internal'
import ClientMissionNode from '../nodes'

/**
 * Class representing a mission action on the client-side.
 */
export default class ClientMissionAction extends MissionAction<
  ClientMission,
  ClientMissionNode,
  ClientExternalEffect,
  ClientInternalEffect
> {
  // Implemented
  public parseExternalEffects(
    data: TCommonExternalEffectJson[],
  ): ClientExternalEffect[] {
    return data.map(
      (datum: TCommonExternalEffectJson) =>
        new ClientExternalEffect(this, datum),
    )
  }

  // Implemented
  public parseInternalEffects(
    data: TCommonInternalEffectJson[],
  ): ClientInternalEffect[] {
    return data.map(
      (datum: TCommonInternalEffectJson) =>
        new ClientInternalEffect(this, datum),
    )
  }
}
