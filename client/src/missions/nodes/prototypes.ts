import ClientMission, { TClientMissionTypes } from '..'
import MissionPrototype, {
  TCommonMissionPrototype,
  TMissionPrototypeOptions,
} from '../../../../shared/missions/nodes/prototypes'
import { Vector2D } from '../../../../shared/toolbox/space'

/**
 * Class for managing mission prototypes on the client.
 */
export default class ClientMissionPrototype extends MissionPrototype<TClientMissionTypes> {
  // Implemented
  public position: Vector2D
  // Implemented
  public depth: number

  public constructor(
    mission: ClientMission,
    _id: TCommonMissionPrototype['_id'],
    options: TMissionPrototypeOptions<ClientMissionPrototype> = {},
  ) {
    super(mission, _id, options)

    this.position = new Vector2D(0, 0)
    this.depth = -1
  }
}
