import fs from 'fs'

/**
 * A utility class for managing files.
 */
export default class FileToolbox {
  /**
   * @param dir The directory to check.
   * @returns Whether the given directory is a folder.
   */
  public static isFolder(dir: string): boolean {
    try {
      return fs.lstatSync(dir).isDirectory()
    } catch (error) {
      return false
    }
  }
}
