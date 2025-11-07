/**
 * A utility class for making conditional
 * function calls.
 */
export class CallToolbox {
  /**
   * Conditionally calls the provided function
   * with the given arguments if the given
   * arguments are all not `null` or `undefined`.
   * @param fn The function to call.
   * @param args The arguments to check.
   */
  public static ifNonNullable<TArgs extends any[]>(
    fn: (...args: NonNullableTuple<TArgs>) => void,
    ...args: TArgs
  ) {
    for (let arg of args) {
      if (arg === null || arg === undefined) return
    }
    fn(...(args as NonNullableTuple<TArgs>))
  }
}

/* -- TYPES -- */

/**
 * A mapped tuple type which makes every element
 * in the provided tuple type `T` non-nullable.
 */
export type NonNullableTuple<T extends readonly unknown[]> = {
  [K in keyof T]: NonNullable<T[K]>
}
