/**
 * Performs a serialization of the given object to JSON
 * based on the specified instructions passed.
 * @param object The object to serialize.
 * @param directConversion The list of keys which can be directly
 * copied from the object to the JSON representation.
 * @param indirectConversion An optional tuple where the first element
 * is a list of keys which are indirectly copied from the object to the
 * JSON representation and the second element is a function which takes
 * in the values of those keys in the same order passed and returns an
 * array of the corresponding values to be placed in the JSON representation.
 * @returns A JSON representation of the object.
 */
export function serializeJson<
  T extends TJsonSerializable<any>,
  TDirect extends Array<keyof T>,
  TIndirect extends {},
>(
  object: T,
  directConversion: TDirect,
  indirectConversion?: () => TIndirect,
): { [k in TDirect[number]]: T[k] } & TIndirect {
  let json: any = {}

  for (let key of directConversion) {
    json[key] = (object as any)[key]
  }

  if (indirectConversion) {
    Object.assign(json, indirectConversion())
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
