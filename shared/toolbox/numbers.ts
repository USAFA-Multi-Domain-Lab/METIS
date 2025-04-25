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
    return !`${number}`.includes('.')
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
