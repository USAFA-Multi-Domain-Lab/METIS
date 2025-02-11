/**
 * Utility class for working with arrays.
 */
export default class ArrayToolbox {
  /**
   * Get the last value of an array.
   * @param array The array to get the last value of.
   * @returns The last value of the array.
   * @throws If the array is empty.
   */
  public static lastOf<T>(array: Array<T>): T {
    if (array.length === 0) {
      throw new Error('Cannot get last value of empty array.')
    }
    return array[array.length - 1]
  }

  /**
   * Checks to see if the values of two arrays are identical and in order (Not deep).
   * @param list1 First list to compare.
   * @param list2 Second list to compare.
   * @returns Whether the lists are identical.
   */
  public static areIdentical(list1: any[], list2: any[]): boolean {
    if (list1.length !== list2.length) {
      return false
    }

    for (let i = 0; i < list1.length; i++) {
      if (list1[i] !== list2[i]) {
        return false
      }
    }

    return true
  }
}

/* -- TYPES -- */

/**
 * An array with at least one index.
 */
export type TNonEmptyArray<T> = [T, ...T[]]
