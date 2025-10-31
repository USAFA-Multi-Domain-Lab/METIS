/**
 * Conditionall calls the provided function
 * with the given arguments if the given
 * arguments are all not `null` or `undefined`.
 * @param fn The function to call.
 * @param args The arguments to check.
 */
export function ifNonNullable<TArgs extends any[]>(
  fn: (...args: NonNullableTuple<TArgs>) => void,
  ...args: TArgs
) {
  for (let arg of args) {
    if (arg === null || arg === undefined) return
  }
  fn(...(args as NonNullableTuple<TArgs>))
}

let x: [number, string, string | null] = [1, 'test', 'hello']
let y: NonNullable<typeof x> = [1, 'test', 'hello']

// Make every element in a tuple (or array) NonNullable
export type NonNullableTuple<T extends readonly unknown[]> = {
  [K in keyof T]: NonNullable<T[K]>
}
