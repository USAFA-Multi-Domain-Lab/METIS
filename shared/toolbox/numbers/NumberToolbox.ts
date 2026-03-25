/**
 * A static utility class for working with numbers.
 */
export class NumberToolbox {
  /**
   * @param number The number to check.
   * @returns Whether the given number is an integer.
   */
  public static isInteger(number: number): boolean {
    return (
      !`${number}`.includes('.') &&
      !Number.isNaN(number) &&
      number !== Infinity &&
      Math.floor(number) === number
    )
  }

  /**
   * @param number The number to check.
   * @returns Whether the given number is a non-negative integer.
   */
  public static isNonNegativeInteger(number: number): boolean {
    return NumberToolbox.isInteger(number) && number >= 0
  }

  /**
   * @param number The number to check.
   * @returns Whether the given number is a non-negative number.
   */
  public static isNonNegative(number: number): boolean {
    return !Number.isNaN(number) && number !== Infinity && number >= 0
  }

  /**
   * @param num The number to check.
   * @param min The minimum permissible value.
   * @param max The maximum permissible value.
   * @returns Whether `nun` is between `min` and `max`.
   */
  public static isBetween(num: number, min: number, max: number): boolean {
    return num >= min && num <= max
  }

  /**
   * @param value The integer to format.
   * @returns A compact string representation of the integer, e.g. `1173` → `"1.1K"`, `-3234372` → `"-3.2M"`.
   */
  public static formatCompact(value: number): string {
    const sign = value < 0 ? '-' : ''
    const absolute = Math.abs(value)

    const thresholds = [
      { divisor: 1_000_000_000, suffix: 'B' },
      { divisor: 1_000_000, suffix: 'M' },
      { divisor: 1_000, suffix: 'K' },
    ]

    for (const threshold of thresholds) {
      if (absolute >= threshold.divisor) {
        const divided = absolute / threshold.divisor
        const decimals = divided >= 100 ? 0 : 1
        const truncated = Math.floor(divided * 10 ** decimals) / 10 ** decimals
        const displayDecimals = truncated % 1 === 0 ? 0 : decimals
        return `${sign}${truncated.toFixed(displayDecimals)}${threshold.suffix}`
      }
    }

    return `${sign}${absolute}`
  }
}
