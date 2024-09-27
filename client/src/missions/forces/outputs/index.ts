import { TClientMissionTypes } from 'src/missions'
import ClientActionExecution from 'src/missions/actions/executions'
import ClientMissionForce from '..'
import Output, {
  TCommonOutputJson,
  TOutputOptions,
} from '../../../../../shared/missions/forces/outputs'

/**
 * An output that's displayed in a force's output panel on the client.
 */
export default class ClientOutput extends Output<TClientMissionTypes> {
  /**
   * @param data The data for the output.
   * @param options The options for the output.
   */
  public constructor(
    force: ClientMissionForce,
    data: Partial<TCommonOutputJson> = ClientOutput.DEFAULT_PROPERTIES,
    options: Partial<TClientOutputOptions> = {},
  ) {
    super(data, options)

    // If there is an execution, create a new action execution object.
    if (data.execution && this.actionId) {
      // Get the action that the execution is for.
      let action = force.actions.get(this.actionId)
      // If the action exists, create a new action execution object.
      if (action) {
        this._execution = new ClientActionExecution(
          action,
          data.execution.start,
          data.execution.end,
        )
      }
    }
  }
}

/**
 * Options used for creating a `ServerOutput`.
 */
export type TClientOutputOptions = TOutputOptions & {}
