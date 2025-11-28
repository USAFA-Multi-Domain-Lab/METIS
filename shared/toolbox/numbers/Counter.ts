/**
 * A simple counter class to allow incrementing
 * and decrementing a number.
 */
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
