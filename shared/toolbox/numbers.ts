/**
 * Global validator for integers.
 * @param value The value to validate.
 */
export function isInteger(value: number): boolean {
  return (
    !`${value}`.includes('.') &&
    !Number.isNaN(value) &&
    value !== Infinity &&
    Math.floor(value) === value
  )
}

/**
 * Global validator for non-negative integers.
 * @param value The value to validate.
 */
export function isNonNegativeInteger(value: number): boolean {
  let isNonNegative: boolean = value >= 0

  return isInteger(value) && isNonNegative
}

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
export class NumberToolbox {}

export default {
  isInteger,
  isNonNegativeInteger,
  Counter,
}
