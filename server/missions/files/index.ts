import MissionFile, { TMissionFileJson } from 'metis/missions/files/'
import ServerFileReference from 'metis/server/files/references'
import ServerMission from '..'

/**
 * Server implementation of `MissionFile` class.
 */
export default class ServerMissionFile extends MissionFile {
  /**
   * Creates a new `ServerMissionFile` instance from JSON.
   * @param data The JSON data from which to create the instance.
   * @param mission The mission to which this file belongs.
   */
  public static fromJson(
    data: TMissionFileJson,
    mission: ServerMission,
  ): ServerMissionFile {
    let reference = new ServerFileReference(
      data.reference._id,
      data.reference.name,
      data.reference.path,
      data.reference.mimetype,
      data.reference.size,
    )
    return new ServerMissionFile(
      data._id,
      data.alias,
      data.initialAccess,
      reference,
      mission,
    )
  }
}
