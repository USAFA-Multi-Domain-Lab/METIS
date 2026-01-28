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
