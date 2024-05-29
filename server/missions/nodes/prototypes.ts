import MissionPrototype from 'metis/missions/nodes/prototypes'
import ServerMission from '..'

/**
 * Class for managing mission prototypes on the server.
 */
export default class ServerMissionPrototype extends MissionPrototype<
  ServerMission,
  ServerMissionPrototype
> {}
