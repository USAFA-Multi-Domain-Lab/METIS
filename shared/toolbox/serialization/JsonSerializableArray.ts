import type { TJsonSerializable } from '../serialization/json'

/**
 * An array that can be serialized to JSON
 * via `toJson()`.
 */
export class JsonSerializableArray<
  T extends TJsonSerializable<ReturnType<T['toJson']>>,
>
  extends Array<T>
  implements TJsonSerializable<Array<ReturnType<T['toJson']>>>
{
  public constructor(...items: Array<T>) {
    super(...items)
    Object.setPrototypeOf(this, JsonSerializableArray.prototype)
  }

  /**
   * @returns a serialized-JSON version of
   * this array.
   */
  public toJson(): Array<ReturnType<T['toJson']>> {
    return this.map((item: T) => item.toJson())
  }

  /**
   * Deserializes a JSON array into a `JsonSerializableArray` of the specified type.
   * @param jsonArray The JSON array to deserialize.
   * @param fromJsonCallback A callback function that takes a JSON object and
   * returns an instance of type `T`.
   * @returns A {@link JsonSerializableArray} containing the deserialized items.
   * @note If `jsonArray` is null or undefined, this method will return an empty `JsonSerializableArray`.
   */
  public static fromJson<T extends TJsonSerializable<ReturnType<T['toJson']>>>(
    jsonArray: ReturnType<T['toJson']>[] | null | undefined,
    fromJsonCallback: (json: ReturnType<T['toJson']>) => T,
  ): JsonSerializableArray<T> {
    let items: T[] = []
    if (jsonArray) {
      items = jsonArray.map(fromJsonCallback)
    }
    return new JsonSerializableArray(...items)
  }
}
