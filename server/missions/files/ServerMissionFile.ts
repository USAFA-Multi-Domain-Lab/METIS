import { ServerFileReference } from '@server/files/ServerFileReference'
import type { TTargetEnvExposedFile } from '@server/target-environments/TargetEnvContext'
import type { TMissionFileJson } from '@shared/missions/files/MissionFile'
import { MissionFile } from '@shared/missions/files/MissionFile'
import type { ServerMission } from '../ServerMission'

/**
 * Server implementation of `MissionFile` class.
 */
export class ServerMissionFile extends MissionFile<TMetisServerComponents> {
  /**
   * @returns The properties from the file that are
   * safe to expose in a target script.
   */
  public toTargetEnvContext(): TTargetEnvExposedFile {
    const self = this
    return {
      _id: self._id,
      name: self.name,
      originalName: self.originalName,
      alias: self.alias,
      initialAccess: self.initialAccess,
      mimetype: self.mimetype,
      size: self.size,
      extension: self.extension,
      get mission() {
        return self.mission.toTargetEnvContext()
      },
    }
  }

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
