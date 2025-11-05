import type { TOutputContext, TOutputJson } from 'metis/missions'
import { MissionOutput } from 'metis/missions'
import { StringToolbox } from 'metis/toolbox'
import type { ServerMissionForce } from './ServerMissionForce'

/**
 * An output that's displayed in a force's output panel on the server.
 */
export class ServerOutput extends MissionOutput<TMetisServerComponents> {
  /**
   * @param force The force where the output panel belongs.
   * @param data The data for the output.
   * @param options The options for the output.
   */
  public constructor(force: ServerMissionForce, data: TOutputJson) {
    super(force, data)
  }

  public static generate(
    force: ServerMissionForce,
    prefix: string,
    message: string,
    context: TOutputContext,
    memberId: string | undefined = undefined,
  ): ServerOutput {
    return new ServerOutput(force, {
      _id: StringToolbox.generateRandomId(),
      forceId: force._id,
      prefix,
      message,
      time: Date.now(),
      context,
      memberId,
    })
  }
}

/* -- TYPES -- */

/**
 * Options used for creating a `ServerOutput`.
 */
export type TServerOutputOptions = {
  /**
   * Restricts the output to a specific member only,
   * if defined.
   */
  memberId?: string
}

/**
 * Represents who the output is broadcasted to.
 * @option force Broadcasted to all users within the same force.
 * @option user Broadcasted only to the user who triggered the output.
 */
export type TOutputBroadcast = 'force' | 'user'
