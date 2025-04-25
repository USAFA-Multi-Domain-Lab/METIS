import { TMetisClientComponents } from 'src'
import ClientFileReference from 'src/files/references'
import ClientMission from '..'
import { TFileReferenceJson } from '../../../../shared/files/references'
import MissionFile, {
  TMissionFileJson,
} from '../../../../shared/missions/files/'
import StringToolbox from '../../../../shared/toolbox/strings'

/**
 * Client implementation of `MissionFile` class.
 */
export default class ClientMissionFile extends MissionFile<TMetisClientComponents> {
  /**
   * The MIME type of the file.
   */
  public get mimetype(): string {
    return this.reference.mimetype
  }

  /**
   * The size of the file.
   */
  public get size(): number {
    return this.reference.size
  }

  /**
   * Downloads the file from the server by opening up
   * a new tab with the file's URI.
   */
  public download(): void {
    this.reference.download()
  }

  /**
   * Creates a new `ClientMissionFile` instance from JSON.
   * @param data The JSON data from which to create the instance.
   * @param mission The mission to which this file belongs.
   */
  public static fromJson(
    data: TMissionFileJson,
    mission: ClientMission,
  ): ClientMissionFile {
    let referenceJson: TFileReferenceJson | string = data.reference

    if (typeof referenceJson === 'string') {
      throw new Error(
        '`reference` property must be populated to create a `ClientMissionFile` instance.',
      )
    }

    let reference = new ClientFileReference(
      data.reference._id,
      referenceJson.name,
      referenceJson.path,
      referenceJson.mimetype,
      referenceJson.size,
    )

    return new ClientMissionFile(
      data._id,
      data.alias,
      data.initialAccess,
      reference,
      mission,
    )
  }

  /**
   * Creates a `ClientMissionFile` instance with standard
   * values from a `ClientFileReference` instance.
   * @param reference The file reference to use.
   * @param mission The mission of which this file is becoming
   * a part.
   * @returns A new `ClientMissionFile` instance.
   */
  public static fromFileReference(
    reference: ClientFileReference,
    mission: ClientMission,
  ): ClientMissionFile {
    return new ClientMissionFile(
      StringToolbox.generateRandomId(),
      reference.name,
      true,
      reference,
      mission,
    )
  }
}
