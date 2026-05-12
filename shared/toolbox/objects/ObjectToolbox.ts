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

  /**
   * Calculates the depth of the provided object
   * in terms of layers of nested objects.
   * @param object The object of which to calculate depth.
   * @return The depth of the object.
   * @note that the parent object is counted as depth 1.
   * This means an object with exactly one nested
   * object will have a depth of 2, and so on.
   */
  public static calculateDepth(object: TAnyObject): number {
    if (object === null || typeof object !== 'object') return 0

    let max = 0

    for (const key in object) {
      max = Math.max(max, ObjectToolbox.calculateDepth(object[key]))
    }

    return max + 1
  }

  /**
   * Creates an object where each key from `initializers` is lazy-initialized:
   * the callback is called at most once, on the first read of that key.
   * If a key is written before it is read, the initializer is never called.
   * Keys from `statics` are merged in as plain values.
   * @param initializers A map of keys to initializer callbacks.
   * @param statics An optional map of keys to static values.
   * @returns A combined object with lazy and static properties.
   */
  public static lazy<
    TInits extends Record<string, () => any>,
    TStatics extends Record<string, any> = Record<never, never>,
  >(
    initializers: TInits,
    statics?: TStatics,
  ): { [K in keyof TInits]: ReturnType<TInits[K]> } & TStatics {
    const result: any = {}

    for (const key in initializers) {
      let _value: any
      let _set = false
      const init = initializers[key]

      Object.defineProperty(result, key, {
        get() {
          if (!_set) {
            _value = init()
            _set = true
          }
          return _value
        },
        set(v: any) {
          _value = v
          _set = true
        },
        enumerable: true,
        configurable: true,
      })
    }

    if (statics) Object.assign(result, statics)

    return result
  }
}

/* -- TYPES -- */

/**
 * The following type with a string key included.
 */
export type TWithKey<T> = T & { key: string }

export type TAnyObject = Record<string | number | symbol, any>

export type TUnknownObject = Record<string | number | symbol, unknown>

/**
 * An object that can have any key but every
 * value must be of the same type.
 * @param TValue The type for the values.
 */
export interface TSingleTypeObject<TValue> {
  [key: string | number | symbol]: TValue
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

/**
 * Shows a lint error if T is not assignable to U.
 * Use this to verify that a type has the expected shape.
 */
export type TSatisfies<T extends U, U> = T
