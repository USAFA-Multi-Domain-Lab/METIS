/**
 * Factory function to create a basic `toJson` method
 * implementation for a class which implements the
 * {@link TJsonSerializable} interface.
 * @param object The object, which implements TJsonSerializable,
 * for which to create the `toJson` method.
 * @param directConversion The list of keys which can be directly
 * copied from the object to the JSON representation.
 * @returns a `toJson` method implementation.
 */
export function createToJsonMethod<
  T extends TJsonSerializable<TJson>,
  TJson extends Record<string, any>,
>(object: T, directConversion: Array<keyof TJson & keyof T>) {
  return function toJson(): TJson {
    let json: any = {}

    for (let key of directConversion) {
      json[key] = (object as any)[key]
    }

    return json
  }
}

/* -- TYPES -- */

/**
 * Represents an object that can be serialized to JSON.
 */
export type TJsonSerializable<TJson> = {
  /**
   * @returns a serialized-JSON version of
   * this object.
   */
  toJson(): TJson
}
