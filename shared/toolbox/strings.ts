import { v4 as generateHash } from 'uuid'

/**
 * Utility functions for working with strings.
 */
export default class StringsToolbox {
  /**
   * Limits the given string to the given number of characters.
   * @note Three extra characters are cut at the end of the result to include an elipsis.
   * @param toLimit The string to limit.
   * @param maxCharacters The number of characters to limit it to.
   * @returns The resulting string.
   */
  public static limit(toLimit: string, maxCharacters: number) {
    if (toLimit.length > maxCharacters) {
      toLimit = toLimit.substr(0, maxCharacters - 3)
      toLimit += '...'
    }
    return toLimit
  }

  /**
   * Generates a random hash that can be used as a unique ID.
   * @returns The random hash.
   */
  public static generateRandomID(): string {
    return generateHash()
  }
}
