export function isInteger(number: number): boolean {
  return !`${number}`.includes('.')
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
}

export default {
  isInteger,
  Counter,
}
