export interface AnyObject {
  [key: string]: any
}

export interface SingleTypeObject<TValue> {
  [key: string]: TValue
}

export default class ObjectToolbox {
  /**
   * Map a new object with the values at each key mapped using mapFn(value)
   * @param {Object} object The original objet to map.
   * @param {Function} mapFunction The function to be applied to each value in the object.
   * @returns {Object} A new mapped object.
   */
  public static map(
    object: AnyObject,
    mapFunction: (key: string, value: any) => any,
  ) {
    return Object.keys(object).reduce(function (result: any, key: string) {
      result[key] = mapFunction(key, object[key])
      return result
    }, {})
  }
}
