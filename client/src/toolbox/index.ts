/**
 * Immediately returns the computed value of the function
 * that is passed to it.
 * @param func The function used to compute the value.
 * @returns The computed value of the function.
 */
export const compute = <TValue>(func: () => TValue): TValue => {
  return func()
}
