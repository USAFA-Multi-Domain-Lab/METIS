// Simple counter class for incrementing
// a value up.
export class Counter {
  count: number

  constructor(initialCount: number) {
    this.count = initialCount
  }

  // This ticks the count up one.
  increment(): void {
    this.count++
  }

  // This ticks the count down one.
  decrement(): void {
    this.count--
  }
}

/**
 * A static utility class for working with numbers.
 */
export default class NumberToolbox {
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
    return number >= 0
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
