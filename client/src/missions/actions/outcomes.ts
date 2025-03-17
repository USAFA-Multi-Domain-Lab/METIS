import { TClientMissionTypes } from '..'
import ExecutionOutcome, {
  TOutcomeState,
} from '../../../../shared/missions/actions/outcomes'
import ClientActionExecution from './executions'

/**
 * An outcome for the execution of an action via the MissionNode.prototype.execute method.
 */
export default class ClientExecutionOutcome extends ExecutionOutcome<TClientMissionTypes> {
  /**
   * @param state The state of the outcome.
   * @param execution The execution associated with the outcome.
   */
  public constructor(state: TOutcomeState, execution: ClientActionExecution) {
    super(state, execution)
  }
}
