import type { TAnyObject } from './types'

/**
 * A utility class for working with objects.
 */
export class ObjectToolbox {
  /**
   * Map a new object with the values at each key mapped using mapFn(value)
   * @param object The original objet to map.
   * @param mapFunction The function to be applied to each value in the object.
   * @returns A new mapped object.
   */
  public static map(
    object: TAnyObject,
    mapFunction: (key: string, value: any) => any,
  ) {
    return Object.keys(object).reduce(function (result: any, key: string) {
      result[key] = mapFunction(key, object[key])
      return result
    }, {})
  }
}
