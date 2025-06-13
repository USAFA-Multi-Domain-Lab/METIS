/**
 * The file argument type for a target.
 */
export default class FileArg {
  /**
   * The key used in the effect's arguments to reference the file's ID.
   */
  public static readonly FILE_ID = 'fileId'

  /**
   * The key used in the effect's arguments to reference the file's name.
   */
  public static readonly FILE_NAME = 'fileName'
}

/* ------------------------------ FORCE ARGUMENT TYPES ------------------------------ */

/**
 * The possible metadata schema for a file target-argument
 * that is present in an effect's arguments.
 */
export type TFileMetadata = Partial<{
  /**
   * A file's ID.
   */
  fileId: string
  /**
   * A force's name.
   */
  fileName: string
}>
