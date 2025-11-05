import type { TInstanceOrArray, TMethodKeys } from './types'

/**
 * Utility class for working with arrays.
 */
export class ArrayToolbox {
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

  /**
   * Maps an array calling the given method on each element,
   * storing the returned values of the method in a new array.
   * @param array The array to map.
   * @param method The method to call on each element.
   */
  public static methodMap<
    TInput extends Record<TMethodKey, (...args: any) => any>,
    TMethodKey extends TMethodKeys<TInput> = TMethodKeys<TInput>,
    TOutput extends ReturnType<TInput[TMethodKey]> = ReturnType<
      TInput[TMethodKey]
    >,
  >(array: TInput[], key: TMethodKey): TOutput[] {
    return array.map((element: TInput) => element[key]())
  }

  /**
   * Converts an object compatible with the `TOneOrMany<T>` type
   * to an array of values of type `T`.
   * @param value The value to convert to an array.
   * @returns The array of values.
   */
  public static toArray<T>(value: TInstanceOrArray<T>): T[] {
    return Array.isArray(value) ? value : [value]
  }
}
