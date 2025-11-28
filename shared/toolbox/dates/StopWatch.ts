/**
 * A simple stopwatch class for measuring time elapsed with high-resolution precision.
 * Uses performance.now() for sub-millisecond accuracy.
 */
export class StopWatch {
  /**
   * The time the stopwatch was started (high-resolution timestamp).
   */
  private startTime: number | null

  /**
   * The time the stopwatch was stopped (high-resolution timestamp).
   */
  private stopTime: number | null

  /**
   * The time elapsed between the start and stop times in milliseconds.
   * Includes sub-millisecond precision (microseconds).
   */
  public get elapsedTime(): number {
    if (this.startTime === null) {
      return 0
    }

    if (this.stopTime === null) {
      return performance.now() - this.startTime
    }

    return this.stopTime - this.startTime
  }

  /**
   * Formats the elapsed time in non-rounded seconds with microsecond precision.
   */
  public get formattedElapsedTime(): string {
    return `${(this.elapsedTime / 1000).toFixed(3)}s`
  }

  public constructor() {
    this.startTime = null
    this.stopTime = null
  }

  /**
   * Starts the stopwatch.
   * @returns The stopwatch instance.
   */
  public start(): StopWatch {
    this.startTime = performance.now()
    return this
  }

  /**
   * Stops the stopwatch.
   *  @returns The stopwatch instance.
   */
  public stop(): StopWatch {
    this.stopTime = performance.now()
    return this
  }

  /**
   * Resets the stopwatch.
   * @returns The stopwatch instance.
   */
  public reset(): StopWatch {
    this.startTime = null
    this.stopTime = null
    return this
  }

  /**
   * Prints the elapsed time to the console.
   *  @returns The stopwatch instance.
   */
  public log(): StopWatch {
    console.log(this.formattedElapsedTime)
    return this
  }
}
