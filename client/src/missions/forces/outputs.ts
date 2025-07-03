import { TMetisClientComponents } from 'src'
import ClientMissionForce from '.'
import Output, { TOutputJson } from '../../../../shared/missions/forces/output'

/**
 * An output that's displayed in a force's output panel on the client.
 */
export default class ClientOutput extends Output<TMetisClientComponents> {
  /**
   * @param data The data for the output.
   * @param options The options for the output.
   */
  public constructor(force: ClientMissionForce, data: TOutputJson) {
    super(force, data)
  }
}
