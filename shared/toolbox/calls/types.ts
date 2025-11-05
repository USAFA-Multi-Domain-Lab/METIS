/**
 * A mapped tuple type which makes every element
 * in the provided tuple type `T` non-nullable.
 */
export type NonNullableTuple<T extends readonly unknown[]> = {
  [K in keyof T]: NonNullable<T[K]>
}
