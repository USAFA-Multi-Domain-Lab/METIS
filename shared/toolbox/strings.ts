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
   * @param input A string in camelCase, PascalCase, or snake_case, or kebab-case.
   * @returns A string in Title Case.
   * @example
   * StringToolbox.toTitleCase('helloWorld') // Hello World
   * StringToolbox.toTitleCase('HelloWorld') // Hello World
   * StringToolbox.toTitleCase('hello_world') // Hello World
   * StringToolbox.toTitleCase('hello-world') // Hello World
   */
  public static toTitleCase(input: string): string {
    const exceptions = new Set([
      'a',
      'an',
      'and',
      'as',
      'at',
      'but',
      'by',
      'for',
      'in',
      'nor',
      'of',
      'on',
      'or',
      'the',
      'to',
      'up',
      'with',
    ])

    const words = input
      .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase → camel Case
      .replace(/[_-]/g, ' ') // snake_case / kebab-case → space
      .replace(/\s+/g, ' ') // collapse spaces
      .trim()
      .toLowerCase()
      .split(' ')

    return words
      .map((word, index) => {
        const isFirstOrLast = index === 0 || index === words.length - 1
        if (exceptions.has(word) && !isFirstOrLast) return word
        return word.charAt(0).toUpperCase() + word.slice(1)
      })
      .join(' ')
  }
}
