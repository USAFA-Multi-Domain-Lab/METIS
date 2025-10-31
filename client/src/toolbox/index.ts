/**
 * Immediately returns the computed value of the function
 * that is passed to it.
 * @param func The function used to compute the value.
 * @returns The computed value of the function.
 */
export const compute = <TValue>(func: () => TValue): TValue => {
  return func()
}

/**
 * @returns The operating system of the user.
 */
export function getOs(): TOs {
  const userAgent = navigator.userAgent
  if (userAgent.indexOf('Win') !== -1) return 'windows'
  if (userAgent.indexOf('Mac') !== -1) return 'mac-os'
  if (userAgent.indexOf('X11') !== -1) return 'unix'
  if (userAgent.indexOf('Linux') !== -1) return 'linux'
  return 'unknown'
}

/* -- TYPES -- */

/**
 * Different recognized operating systems by METIS.
 */
export type TOs = 'windows' | 'mac-os' | 'unix' | 'linux' | 'unknown'
