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
 * class MyClass implements TJsonSerializable<{ _id: string; name?: string }, { includeName: boolean }> {
 *   public constructor(public _id: string, public name: string) {}
 *
 *   public get json() {
 *     return this.serialize()
 *   }
 *
 *   public serialize(options: TSerializeOptions = {}) {
 *     let { includeName = true } = options
 *     let json = serializeJson(this, ['_id', 'name'])
 *     if (!includeName) {
 *       delete json.name
 *     }
 *     return json
 *   }
 * }
 */
export type TJsonSerializable<TJson, TSerializeOptions = {}> = {
  /**
   * The JSON representation type of this object.
   * @note This will be what the {@link serialize} method returns
   * if no options are provided.
   */
  get json(): TJson
  /**
   * Serializes this object based on the specified options.
   * @param options The options to use for serialization.
   * @return A JSON representation of this object based on the
   * specified options.
   * @note If no options are available, this method will simply
   * return {@link json} unmodified.
   */
  serialize(options?: TSerializeOptions): TJson
}
