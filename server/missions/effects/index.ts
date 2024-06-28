import Effect from 'metis/missions/effects'
import ServerTarget from 'metis/server/target-environments/targets'
import { TServerMissionTypes } from '..'

/**
 * Class representing an effect on the server-side that can be
 * applied to a target.
 */
export default class ServerEffect extends Effect<TServerMissionTypes> {
  // Implemented
  public async populateTargetData(targetId: string): Promise<void> {
    // Get the target from the target environment.
    let target = ServerTarget.getTarget(targetId)

    // If the target is found, set it.
    if (target) {
      this._target = target
    }
  }
}
