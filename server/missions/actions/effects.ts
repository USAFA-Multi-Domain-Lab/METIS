import { Effect } from 'metis/missions/actions/effects'
import ServerMissionAction from '.'
import { ServerTargetEnvironment } from 'metis/server/target-environments'

/**
 * Class representing an effect on the server-side that can be
 * applied to a target.
 */
export class ServerEffect extends Effect<
  ServerMissionAction,
  ServerTargetEnvironment
> {
  // Implemented
  public async populateTargetData(targetId: string): Promise<void> {}
}

/* ------------------------------ SERVER EFFECT TYPES ------------------------------ */
