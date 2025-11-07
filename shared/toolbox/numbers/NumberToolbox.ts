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
}
