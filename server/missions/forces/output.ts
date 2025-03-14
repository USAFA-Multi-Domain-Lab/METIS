import MissionOutput, {
  TOutputContext,
  TOutputJson,
} from 'metis/missions/forces/output'
import ServerUser from 'metis/server/users'
import StringToolbox from 'metis/toolbox/strings'
import ServerMissionForce from '.'
import { TServerMissionTypes } from '..'

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
    data: TOutputJson,
    options: Partial<TServerOutputOptions> = {},
  ) {
    super(force, data)

    let { userId = null, broadcastType = 'force' } = options

    this.broadcastType = broadcastType
    this.userId = userId
  }

  public static generate(
    force: ServerMissionForce,
    prefix: string,
    message: string,
    context: TOutputContext,
    options: Partial<TServerOutputOptions> = {},
  ): ServerOutput {
    return new ServerOutput(
      force,
      {
        _id: StringToolbox.generateRandomId(),
        forceId: force._id,
        prefix,
        message,
        time: Date.now(),
        context,
      },
      options,
    )
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
}

/**
 * Represents who the output is broadcasted to.
 * @option force Broadcasted to all users within the same force.
 * @option user Broadcasted only to the user who triggered the output.
 */
export type TOutputBroadcast = 'force' | 'user'
