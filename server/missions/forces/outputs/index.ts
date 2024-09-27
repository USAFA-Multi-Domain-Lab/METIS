import Output, {
  TCommonOutputJson,
  TOutputOptions,
} from 'metis/missions/forces/outputs'
import ServerUser from 'metis/server/users'
import { TServerMissionTypes } from '../..'
import ServerMissionAction from '../../actions'
import ServerActionExecution from '../../actions/executions'

/**
 * An output that's displayed in a force's output panel on the server.
 */
export default class ServerOutput extends Output<TServerMissionTypes> {
  /**
   * The ID of the user who triggered the output.
   */
  public readonly userId: ServerUser['_id'] | null
  /**
   * Determines who the output is broadcasted to.
   */
  public readonly broadcastType: TOutputBroadcast

  /**
   * @param data The data for the output.
   * @param options The options for the output.
   */
  public constructor(
    data: Partial<TCommonOutputJson> = ServerOutput.DEFAULT_PROPERTIES,
    options: Partial<TServerOutputOptions> = {},
  ) {
    super(data, options)

    let {
      userId = null,
      broadcastType = 'force',
      execution = null,
      action = null,
    } = options

    this.broadcastType = broadcastType
    this.userId = userId

    // If there is an action and an execution, create a new action execution object.
    if (execution && action) {
      this._execution = new ServerActionExecution(
        action,
        execution.start,
        execution.end,
      )
    }
  }
}

/**
 * Options used for creating a `ServerOutput`.
 */
type TServerOutputOptions = TOutputOptions & {
  /**
   * The ID of the user who triggered the output.
   * @default null
   */
  userId: ServerUser['_id'] | null
  /**
   * Determines who the output is broadcasted to.
   * @default 'force'
   */
  broadcastType: TOutputBroadcast
  /**
   * The action that is being executed.
   * @default null
   */
  action: ServerMissionAction | null
  /**
   * The current execution in process on the node by an action.
   * @default null
   */
  execution: ServerActionExecution | null
}

/**
 * Represents who the output is broadcasted to.
 * @option force Broadcasted to all users within the same force.
 * @option user Broadcasted only to the user who triggered the output.
 */
export type TOutputBroadcast = 'force' | 'user'
