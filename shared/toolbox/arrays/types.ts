export type TMethodKeys<T> = {
  [K in keyof T]: T[K] extends (...args: any) => any ? K : never
}[keyof T]

/**
 * An array with at least one index.
 */
export type TNonEmptyArray<T> = [T, ...T[]]

/**
 * A type which represents either a single value
 * of a certain type or an array of values of that
 * same type.
 */
export type TInstanceOrArray<T> = T | T[]
