import formatDate from 'dateformat'

// -- classes --

/**
 * A toolbox for working with dates.
 */
export class DateToolbox {
  /**
   * Formats a date in a human-readable format.
   * @param date The date to format. Defaults to the current date.
   * @param mask The mask to use for formatting the date. Defaults to `'mm:dd:yyyy HH:MM:ss'`.
   * @param utc Whether to use UTC time. Defaults to false.
   * @param gmt Whether to use GMT time. Defaults to false.
   * @returns The formatted date.
   */
  public static format(
    date: Date | string | number = new Date(),
    mask: string = 'mm:dd:yyyy HH:MM:ss',
    utc: boolean = false,
    gmt: boolean = false,
  ): string {
    return formatDate(date, mask, utc, gmt)
  }

  /**
   * Gets the current date formatted in a standard
   * METIS format that displays hours, minutes, and
   * seconds.
   */
  public static get nowFormatted(): string {
    return this.format(new Date(), 'HH:MM:ss')
  }

  /**
   * Gets the current date formatted in a standard
   * METIS format that displays month, day, year, hours,
   * minutes, and seconds.
   */
  public static get nowTodayFormatted(): string {
    return this.format()
  }

  /**
   * Returns an ISO formatted date string using the
   * `Date.prototype.toISOString` method, returning null
   * if the date is null.
   * @param date The date object.
   * @returns The ISO formatted date string or null if the date is null.
   */
  public static toNullableISOString(date: Date | null): string | null {
    return date === null ? null : date.toISOString()
  }

  /**
   * Creates a date from an ISO formatted date string
   * using the `Date` constructor, returning null if the
   * date string is null.
   * @param date The ISO formatted date string.
   * @returns The date object or null if the date string is null.
   */
  public static fromNullableISOString(date: string | null): Date | null {
    return date === null ? null : new Date(date)
  }
}

/**
 * A simple stopwatch class for measuring time elapsed.
 */
export class Stopwatch {
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
  public start(): Stopwatch {
    this.startTime = new Date()
    return this
  }

  /**
   * Stops the stopwatch.
   *  @returns The stopwatch instance.
   */
  public stop(): Stopwatch {
    this.stopTime = new Date()
    return this
  }

  /**
   * Resets the stopwatch.
   * @returns The stopwatch instance.
   */
  public reset(): Stopwatch {
    this.startTime = null
    this.stopTime = null
    return this
  }

  /**
   * Prints the elapsed time to the console.
   *  @returns The stopwatch instance.
   */
  public log(): Stopwatch {
    console.log(this.formattedElapsedTime)
    return this
  }
}

const defaultExports = {
  DateToolbox,
  Stopwatch,
}

export default defaultExports
