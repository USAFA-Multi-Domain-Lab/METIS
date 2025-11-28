import type { TMetisClientComponents } from '@client/index'
import type { TOutputJson } from '@shared/missions/forces/MissionOutput'
import { MissionOutput } from '@shared/missions/forces/MissionOutput'
import type { ClientMissionForce } from './ClientMissionForce'

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
