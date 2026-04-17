import type { TJsonSerializable } from '../serialization/json'

/**
 * An array that can be serialized to JSON
 * via `toJson()`.
 */
export class JsonSerializableArray<T extends TJsonSerializable<T['json']>>
  extends Array<T>
  implements TJsonSerializable<Array<T['json']>, Parameters<T['serialize']>[0]>
{
  /**
   * A serialized-JSON version of this array.
   */
  public get json(): Array<T['json']> {
    return this.serialize()
  }

  public constructor(...items: Array<T>) {
    super(...items)
    Object.setPrototypeOf(this, JsonSerializableArray.prototype)
  }

  // Implemented
  public serialize(options?: Parameters<T['serialize']>[0]): Array<T['json']> {
    return this.map((item: T) => item.serialize(options))
  }

  // Overridden
  public filter(
    ...args: Parameters<Array<T>['filter']>
  ): JsonSerializableArray<T> {
    let filtered = super.filter(...args)
    return new JsonSerializableArray(...filtered)
  }

  /**
   * Deserializes a JSON array into a `JsonSerializableArray` of the specified type.
   * @param jsonArray The JSON array to deserialize.
   * @param fromJsonCallback A callback function that takes a JSON object and
   * returns an instance of type `T`.
   * @returns A {@link JsonSerializableArray} containing the deserialized items.
   * @note If `jsonArray` is null or undefined, this method will return an empty `JsonSerializableArray`.
   */
  public static fromJson<T extends TJsonSerializable<T['json']>>(
    jsonArray: T['json'][] | null | undefined,
    fromJsonCallback: (json: T['json']) => T,
  ): JsonSerializableArray<T> {
    let items: T[] = []
    if (jsonArray) {
      items = jsonArray.map(fromJsonCallback)
    }
    return new JsonSerializableArray(...items)
  }
}
