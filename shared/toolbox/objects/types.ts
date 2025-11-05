/**
 * The following type with a string key included.
 */
export type TWithKey<T> = T & { key: string }

export type TAnyObject = Record<string | number | symbol, any>

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
