import { MissionOutput, TOutputJson } from 'metis/missions'
import { TMetisClientComponents } from 'src'
import ClientMissionForce from '.'

/**
 * An output that's displayed in a force's output panel on the client.
 */
export class ClientOutput extends MissionOutput<TMetisClientComponents> {
  /**
   * @param data The data for the output.
   * @param options The options for the output.
   */
  public constructor(force: ClientMissionForce, data: TOutputJson) {
    super(force, data)
  }
}
