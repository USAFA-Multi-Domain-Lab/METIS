import FileReference, { TFileReferenceJson } from 'metis/files/references'
import { DateToolbox } from 'metis/toolbox/dates'
import StringToolbox from 'metis/toolbox/strings'

export default class ServerFileReference extends FileReference {
  /**
   * @param json The JSON object to convert.
   * @returns A new {@link ServerFileReference} object from an
   * {@link TFileReferenceJson} object.
   */
  public static fromJson(json: TFileReferenceJson): ServerFileReference {
    return new ServerFileReference(
      json._id,
      json.name,
      json.path,
      json.mimetype,
      json.size,
      DateToolbox.fromNullableISOString(json.createdAt),
      DateToolbox.fromNullableISOString(json.updatedAt),
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
  public static createDeleted(
    knownData: Partial<TFileReferenceJson> = {},
  ): ServerFileReference {
    return new ServerFileReference(
      knownData._id ?? StringToolbox.generateRandomId(),
      knownData.name ?? 'File Deleted',
      knownData.path ?? '/',
      knownData.mimetype ?? 'application/octet-stream',
      knownData.size ?? 0,
      DateToolbox.fromNullableISOString(knownData.createdAt ?? null),
      DateToolbox.fromNullableISOString(knownData.updatedAt ?? null),
      true,
    )
  }
}
