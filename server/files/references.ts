import FileReference, { TFileReferenceJson } from 'metis/files/references'

export default class ServerFileReference extends FileReference {
  /**
   * @param json The JSON object to convert.
   * @returns A new `ServerFileReference` object from the JSON.
   */
  public static fromJson(json: TFileReferenceJson): ServerFileReference {
    return new ServerFileReference(
      json._id,
      json.name,
      json.path,
      json.mimetype,
      json.size,
    )
  }
}
