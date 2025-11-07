import { generateValidationError } from '@server/database/validation'
import { ServerFileToolbox } from '@server/toolbox/files/ServerFileToolbox'
import { ServerUser } from '@server/users/ServerUser'
import type { TFileReferenceJson } from '@shared/files/FileReference'
import { FileReference } from '@shared/files/FileReference'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'

export class ServerFileReference extends FileReference<TMetisServerComponents> {
  /**
   * @param json The JSON object to convert.
   * @returns A new {@link ServerFileReference} object from an
   * {@link TFileReferenceJson} object.
   */
  public static fromJson(json: TFileReferenceJson): ServerFileReference {
    let createdBy: ServerUser

    // Parse reference data.
    if (typeof json.createdBy === 'object') {
      createdBy = ServerUser.fromCreatedByJson(json.createdBy)
    } else {
      createdBy = ServerUser.createUnpopulated(
        json.createdBy,
        json.createdByUsername,
      )
    }

    return new ServerFileReference(
      json._id,
      json.name,
      json.path,
      json.mimetype,
      json.size,
      new Date(json.createdAt),
      new Date(json.updatedAt),
      createdBy,
      json.createdByUsername,
      false,
    )
  }

  /**
   * Creates a new {@link ServerFileReference} instance used to represent
   * a previously-existing and now-deleted file.
   * @param knownData Optional partial data to initialize the reference.
   * Only pass the properties known for the deleted file, if any.
   * @returns A new {@link ServerFileReference} instance.
   */
  public static createDeleted(_id: string, name: string): ServerFileReference {
    return new ServerFileReference(
      _id,
      name,
      '/',
      'application/octet-stream',
      0,
      new Date(),
      new Date(),
      ServerUser.createUnpopulated(
        StringToolbox.generateRandomId(),
        'Unknown User',
      ),
      'Unknown User',
      true,
    )
  }

  /**
   * Ensures that the mimetype of a file is
   * valid in its format.
   * @param mimetype The value to validate.
   */
  public static validateMimetype(mimetype: string): void {
    if (!ServerFileToolbox.isValidMimetype(mimetype)) {
      throw generateValidationError(
        `Error in file-reference:\nMimetype "${mimetype}" is not valid.`,
      )
    }
  }
}
