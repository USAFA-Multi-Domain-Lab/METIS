import InternalEffect from 'metis/missions/effects/internal'
import { TServerMissionTypes } from '..'

/**
 * Class representing an internal effect on the server-side that can be
 * applied to a target.
 */
export default class ServerInternalEffect extends InternalEffect<TServerMissionTypes> {
  // Implemented
  public async populateTargetData(target: string): Promise<void> {}

  // Implemented
  public async populateTargetParamsData(argId: string): Promise<void> {}
}
