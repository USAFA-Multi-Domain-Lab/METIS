import InternalEffect from 'metis/missions/effects/internal'
import ServerTargetEnvironment from 'metis/server/target-environments'
import ServerMission from '..'
import ServerMissionAction from '../actions'
import ServerActionExecution from '../actions/executions'
import { ServerRealizedOutcome } from '../actions/outcomes'
import ServerMissionNode from '../nodes'

/**
 * Class representing an internal effect on the server-side that can be
 * applied to a target.
 */
export default class ServerInternalEffect extends InternalEffect<
  ServerMission,
  ServerMissionNode,
  ServerMissionAction,
  ServerActionExecution,
  ServerRealizedOutcome,
  ServerTargetEnvironment
> {
  // Implemented
  public async populateTargetData(target: string): Promise<void> {}

  // Implemented
  public async populateTargetParamsData(argId: string): Promise<void> {}
}
