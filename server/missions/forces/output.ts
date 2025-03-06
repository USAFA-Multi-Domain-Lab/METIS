import MissionOutput, { TOutputJson } from 'metis/missions/forces/output'
import ServerUser from 'metis/server/users'
import ServerMissionForce from '.'
import { TServerMissionTypes } from '..'
import ServerActionExecution from '../actions/executions'

/**
 * An output that's displayed in a force's output panel on the server.
 */
export default class ServerOutput extends MissionOutput<TServerMissionTypes> {
  /**
   * The ID of the user who triggered the output.
   */
  public readonly userId: ServerUser['_id'] | null
  /**
   * Determines who the output is broadcasted to.
   */
  public readonly broadcastType: TOutputBroadcast

  /**
   * @param force The force where the output panel belongs.
   * @param data The data for the output.
   * @param options The options for the output.
   */
  public constructor(
    force: ServerMissionForce,
    data: Partial<TOutputJson> = ServerOutput.DEFAULT_PROPERTIES,
    options: Partial<TServerOutputOptions> = {},
  ) {
    super(force, data)

    let { userId = null, broadcastType = 'force', execution = null } = options

    this.broadcastType = broadcastType
    this.userId = userId
    this._execution = execution
  }
}

/**
 * Options used for creating a `ServerOutput`.
 */
export type TServerOutputOptions = {
  /**
   * The ID of the user who triggered the output.
   * @default null
   */
  userId?: ServerUser['_id'] | null
  /**
   * Determines who the output is broadcasted to.
   * @default 'force'
   */
  broadcastType?: TOutputBroadcast
  /**
   * The current execution in process on the node by an action.
   * @default null
   */
  execution?: ServerActionExecution | null
}

/**
 * Represents who the output is broadcasted to.
 * @option force Broadcasted to all users within the same force.
 * @option user Broadcasted only to the user who triggered the output.
 */
export type TOutputBroadcast = 'force' | 'user'
