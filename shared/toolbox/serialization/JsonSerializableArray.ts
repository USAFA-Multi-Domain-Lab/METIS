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

  public static fromJson<T extends TJsonSerializable<ReturnType<T['toJson']>>>(
    jsonArray: ReturnType<T['toJson']>[],
    fromJsonCallback: (json: ReturnType<T['toJson']>) => T,
  ): JsonSerializableArray<T> {
    let items = jsonArray.map(fromJsonCallback)
    return new JsonSerializableArray(...items)
  }
}
