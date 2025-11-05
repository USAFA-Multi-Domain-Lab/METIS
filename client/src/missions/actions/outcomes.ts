import { TMetisClientComponents } from 'metis/client'
import { ExecutionOutcome, TOutcomeState } from 'metis/missions'
import ClientActionExecution from './executions'

/**
 * An outcome for the execution of an action via the MissionNode.prototype.execute method.
 */
export class ClientExecutionOutcome extends ExecutionOutcome<TMetisClientComponents> {
  /**
   * @param _id Unique identifier for the outcome.
   * @param state The state of the outcome.
   * @param execution The execution associated with the outcome.
   */
  public constructor(
    _id: string,
    state: TOutcomeState,
    execution: ClientActionExecution,
  ) {
    super(_id, state, execution)
  }
}
