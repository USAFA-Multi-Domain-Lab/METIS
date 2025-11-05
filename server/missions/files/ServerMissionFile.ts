import type { TMissionFileJson } from 'metis/missions'
import { MissionFile } from 'metis/missions'
import { ServerFileReference } from '../../files'
import type { ServerMission } from '../ServerMission'

/**
 * Server implementation of `MissionFile` class.
 */
export class ServerMissionFile extends MissionFile<TMetisServerComponents> {
  /**
   * Creates a new `ServerMissionFile` instance from JSON.
   * @param data The JSON data from which to create the instance.
   * @param mission The mission to which this file belongs.
   */
  public static fromJson(
    data: TMissionFileJson,
    mission: ServerMission,
  ): ServerMissionFile {
    let reference: ServerFileReference

    // Parse reference data.
    if (typeof data.reference === 'object') {
      reference = ServerFileReference.fromJson(data.reference)
    } else {
      reference = ServerFileReference.createDeleted(
        data.reference,
        data.lastKnownName,
      )
    }

    // Create and return new `ServerMissionFile` instance.
    return new ServerMissionFile(
      data._id,
      data.alias,
      data.lastKnownName,
      data.initialAccess,
      reference,
      mission,
    )
  }
}
