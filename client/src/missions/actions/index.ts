import { TClientMissionTypes, TMissionNavigable } from '..'
import MissionAction from '../../../../shared/missions/actions'
import { TCommonExternalEffectJson } from '../../../../shared/missions/effects/external'
import { TCommonInternalEffectJson } from '../../../../shared/missions/effects/internal'
import { ClientExternalEffect } from '../effects/external'
import { ClientInternalEffect } from '../effects/internal'

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
