import ClientMission from '..'
import MissionPrototype from '../../../../shared/missions/nodes/prototypes'

/**
 * Class for managing mission prototypes on the client.
 */
export default class ClientMissionPrototype extends MissionPrototype<
  ClientMission,
  ClientMissionPrototype
> {}
