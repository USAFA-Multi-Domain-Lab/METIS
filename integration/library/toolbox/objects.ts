export interface AnyObject {
  [key: string]: any
}

/**
 * An object that can have any key but every
 * value must be of the same type.
 * @param TValue The type for the values.
 */
export interface TSingleTypeObject<TValue> {
  [key: string]: TValue
}

/**
 * An object that must have only one value type, but
 * the keys are generated from a string union.
 * @param TKeys The union of string keys.
 * @param TValue The type for the values.
 */
export type TSingleTypeMapped<
  TKeys extends string,
  TValue,
  TUsePartial extends boolean = false,
> = TUsePartial extends true
  ? Partial<{
      [key in TKeys]: TValue
    }>
  : {
      [key in TKeys]: TValue
    }

export default class ObjectToolbox {
  /**
   * Map a new object with the values at each key mapped using mapFn(value)
   * @param object The original objet to map.
   * @param mapFunction The function to be applied to each value in the object.
   * @returns A new mapped object.
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

/**
 * The following type with a string key included.
 */
export type TWithKey<T> = T & { key: string }
