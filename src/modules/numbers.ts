export function isInteger(number: number): boolean {
  return !`${number}`.includes('.')
}

export default {
  isInteger,
}
