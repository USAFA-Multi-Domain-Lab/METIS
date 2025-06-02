import { MetisComponent, TMetisBaseComponents } from '..'
import { DateToolbox } from '../toolbox/dates'
import { TUserJson } from '../users'

/**
 * A reference to a file stored in the METIS file store.
 * This provides context to where its located, what
 * it is, and how it can be used.
 */
export default abstract class FileReference<
  T extends TMetisBaseComponents = TMetisBaseComponents,
> extends MetisComponent {
  /**
   * The relative path to the file within the METIS
   * file store.
   */
  public path: string

  /**
   * The MIME type of the file, such as image/png,
   * video/mp4, audio/mpeg, etc.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
   */
  public mimetype: string

  /**
   * The size of the file in bytes.
   */
  public size: number

  /**
   * The date and time when the file was created.
   */
  public createdAt: Date | null

  /**
   * The date and time when the file was last updated.
   */
  public updatedAt: Date | null

  /**
   * The creator of the file.
   */
  public createdBy: T['user']

  /**
   * The username of the user who created the file.
   * @note This is needed in the event that the user
   * has been deleted, yet the file still exists. The
   * username will then be displayed in the UI for the
   * file.
   */
  public createdByUsername: string

  /**
   * See corresponding class properties for details
   * on the parameters of this constructor.
   */
  protected constructor(
    _id: string,
    name: string,
    path: string,
    mimetype: string,
    size: number,
    createdAt: Date | null,
    updatedAt: Date | null,
    createdBy: T['user'],
    createdByUsername: string,
    deleted: boolean,
  ) {
    super(_id, name, deleted)

    this.name = name
    this.path = path
    this.mimetype = mimetype
    this.size = size
    this.createdAt = createdAt
    this.updatedAt = updatedAt
    this.createdBy = createdBy
    this.createdByUsername = createdByUsername
  }

  /**
   * Converts the `FileReference` instance to a JSON representation.
   * @returns The JSON representation of the `FileReference` instance.
   */
  public toJson(): TFileReferenceJson {
    return {
      _id: this._id,
      name: this.name,
      path: this.path,
      mimetype: this.mimetype,
      size: this.size,
      createdAt: DateToolbox.toNullableISOString(this.createdAt),
      updatedAt: DateToolbox.toNullableISOString(this.updatedAt),
      createdBy: this.createdBy.toJson(),
      createdByUsername: this.createdByUsername,
      deleted: this.deleted,
    }
  }
}

/**
 * A JSON representation of the `FileReference` class.
 */
export interface TFileReferenceJson {
  /**
   * @see MetisComponent._id
   */
  _id: string
  /**
   * @see MetisComponent.name
   */
  name: string
  /**
   * @see FileReference.path
   */
  path: string
  /**
   * @see FileReference.mimetype
   */
  mimetype: string
  /**
   * @see FileReference.size
   */
  size: number
  /**
   * @see FileReference.createdAt
   */
  createdAt: string | null
  /**
   * @see FileReference.createdBy
   */
  createdBy: TUserJson | string
  /**
   * @see FileReference.createdByUsername
   */
  createdByUsername: string
  /**
   * @see FileReference.updatedAt
   */
  updatedAt: string | null
  /**
   * @see MetisComponent.deleted
   */
  deleted: boolean
}
