import { TClientMissionTypes, TMissionNavigable } from '..'
import InternalEffect from '../../../../shared/missions/effects/internal'

/**
 * Class representing an external effect on the client-side that can be
 * applied to a target.
 */
export class ClientInternalEffect
  extends InternalEffect<TClientMissionTypes>
  implements TMissionNavigable
{
  public get path(): TMissionNavigable[] {
    return [this.mission, this.force, this.node, this.action, this]
  }

  // Implemented
  public async populateTargetData(target: string): Promise<void> {}

  // Implemented
  public async populateTargetParamsData(argId: string): Promise<void> {}
}
