/**
 * A simple stopwatch class for measuring time elapsed.
 */
export class StopWatch {
  /**
   * The time the stopwatch was started.
   */
  private startTime: Date | null

  /**
   * The time the stopwatch was stopped.
   */
  private stopTime: Date | null

  /**
   * The time elapsed between the start and stop times.
   */
  public get elapsedTime(): number {
    if (this.startTime === null) {
      return 0
    }

    if (this.stopTime === null) {
      return new Date().getTime() - this.startTime.getTime()
    }

    return this.stopTime.getTime() - this.startTime.getTime()
  }

  /**
   * Formats the elapsed time in non-rounded seconds.
   */
  public get formattedElapsedTime(): string {
    const elapsed = this.elapsedTime
    const seconds = Math.floor(elapsed / 1000)
    const milliseconds = elapsed % 1000
    return `${seconds}.${milliseconds.toString().padStart(3, '0')}s`
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
    this.startTime = new Date()
    return this
  }

  /**
   * Stops the stopwatch.
   *  @returns The stopwatch instance.
   */
  public stop(): StopWatch {
    this.stopTime = new Date()
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
