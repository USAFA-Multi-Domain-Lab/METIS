import { TMetisComponent } from '..'

/**
 * A reference to a file stored in the METIS file store.
 * This provides context to where its located, what
 * it is, and how it can be used.
 */
export default abstract class FileReference implements TMetisComponent {
  // Implemented
  public _id: string

  // Implemented
  /**
   * This is the original name of the file when it was
   * uploaded.
   */
  public name: string

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
   * See corresponding class properties for details
   * on the parameters of this constructor.
   */
  public constructor(
    _id: string,
    name: string,
    path: string,
    mimetype: string,
    size: number,
  ) {
    this._id = _id
    this.name = name
    this.path = path
    this.mimetype = mimetype
    this.size = size
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
    }
  }
}

/**
 * A JSON representation of the `FileReference` class.
 */
export interface TFileReferenceJson extends TMetisComponent {
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
}
