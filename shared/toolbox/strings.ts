import { v4 as generateHash } from 'uuid'

/**
 * A regex that checks if a string is a valid hex color.
 */
export const HEX_COLOR_REGEX: RegExp = /^#([a-f0-9]{6})$/

/**
 * Utility functions for working with strings.
 */
export default class StringToolbox {
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
  public static generateRandomId(): string {
    return generateHash()
  }

  /**
   * Capitalizes the first letter of the given string.
   */
  public static capitalize(str: string): string {
    // Replaces the first letter of each word with its uppercase version.
    return str.replace(/\b\w/g, (char) => char.toUpperCase())
  }

  /**
   * Joins multiple path segments into a single path.
   * @param segments The path segments to join.
   * @returns The joined path.
   * @note This function behaves like `path.join` in Node.js, but is
   * implemented in a way that works in the browser.
   */
  public static joinPaths(...segments: string[]): string {
    return segments
      .map((segment, index) => {
        // Remove trailing slash from the first segment.
        if (index === 0) {
          return segment.replace(/\/+$/g, '')
        }
        // Remove leading slashes from the last segment.
        else if (index === segments.length - 1) {
          return segment.replace(/^\/+/g, '')
        }
        // Else, remove leading/trailing slashes.
        else {
          return segment.replace(/^\/+|\/+$/g, '')
        }
      })
      .filter(Boolean) // Remove empty segments
      .join('/')
  }
}
