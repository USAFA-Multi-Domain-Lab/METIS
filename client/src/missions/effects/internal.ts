import { ClientTargetEnvironment } from 'src/target-environments'
import ClientMission from '..'
import InternalEffect from '../../../../shared/missions/effects/internal'
import ClientMissionAction from '../actions'
import ClientActionExecution from '../actions/executions'
import ClientActionOutcome from '../actions/outcomes'
import ClientMissionNode from '../nodes'

/**
 * Class representing an external effect on the client-side that can be
 * applied to a target.
 */
export class ClientInternalEffect extends InternalEffect<
  ClientMission,
  ClientMissionNode,
  ClientMissionAction,
  ClientActionExecution,
  ClientActionOutcome,
  ClientTargetEnvironment
> {
  // Implemented
  public async populateTargetData(target: string): Promise<void> {}

  // Implemented
  public async populateTargetParamsData(argId: string): Promise<void> {}
}
