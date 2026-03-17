/**
 * Performs a serialization of the given object to JSON
 * based on the specified instructions passed.
 * @param object The object to serialize.
 * @param directConversion The list of keys which can be directly
 * copied from the object to the JSON representation.
 * @returns A JSON representation of the object.
 */
export function serializeJson<
  T extends TJsonSerializable<TJson>,
  TJson extends Record<string, any>,
>(object: T, directConversion: Array<keyof TJson & keyof T>): TJson {
  let json: any = {}

  for (let key of directConversion) {
    json[key] = (object as any)[key]
  }

  return json
}

/* -- TYPES -- */

/**
 * Represents an object that can be serialized to JSON.
 * @note Implement this interface to make your class
 * JSON serializable. See example for assistance.
 * @example
 * class MyClass implements TJsonSerializable<{ _id: string; name: string }> {
 *   public constructor(public _id: string, public name: string) {}
 *
 *   public get json() {
 *     return serializeJson(this, ['_id', 'name'])
 *   }
 * }
 */
export type TJsonSerializable<TJson> = {
  /**
   * The JSON representation type of this object.
   */
  get json(): TJson
}
