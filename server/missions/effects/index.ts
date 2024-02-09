import Effect from 'metis/missions/effects'
import ServerMissionAction from '../actions'
import ServerTargetEnvironment from 'metis/server/target-environments'

/**
 * Class representing an effect on the server-side that can be
 * applied to a target.
 */
export default class ServerEffect extends Effect<
  ServerMissionAction,
  ServerTargetEnvironment
> {
  // Implemented
  public async populateTargetData(targetId: string): Promise<void> {}
}
