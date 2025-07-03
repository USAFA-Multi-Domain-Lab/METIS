/* -- functions -- */

/*
 * Date Format 1.2.3
 * (c) 2007-2009 Steven Levithan <stevenlevithan.com>
 * MIT license
 *
 * Includes enhancements by Scott Trenda <scott.trenda.net>
 * and Kris Kowal <cixar.com/~kris.kowal/>
 *
 * Accepts a date, a mask, or a date and a mask.
 * Returns a formatted version of the given date.
 * The date defaults to the current date/time.
 * The mask defaults to dateFormat.masks.default.
 */

var dateFormat = (function () {
  var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
    timezone =
      /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
    timezoneClip = /[^-+\dA-Z]/g,
    pad = function (val: any, len: any = 2) {
      val = String(val)
      while (val.length < len) val = '0' + val
      return val
    }

  // Regexes and supporting functions are cached through closure
  return function (date: any, mask: any, utc: any) {
    var dF: any = dateFormat

    // You can't provide utc if you skip other args (use the "UTC:" mask prefix)
    if (
      arguments.length == 1 &&
      Object.prototype.toString.call(date) == '[object String]' &&
      !/\d/.test(date)
    ) {
      mask = date
      date = undefined
    }

    // Passing date through Date applies Date.parse, if necessary
    date = date ? new Date(date) : new Date()
    if (isNaN(date)) throw SyntaxError('invalid date')

    mask = String(dF.masks[mask] || mask || dF.masks['default'])

    // Allow setting the utc argument via the mask
    if (mask.slice(0, 4) == 'UTC:') {
      mask = mask.slice(4)
      utc = true
    }

    var _ = utc ? 'getUTC' : 'get',
      d = date[_ + 'Date'](),
      D = date[_ + 'Day'](),
      m = date[_ + 'Month'](),
      y = date[_ + 'FullYear'](),
      H = date[_ + 'Hours'](),
      M = date[_ + 'Minutes'](),
      s = date[_ + 'Seconds'](),
      L = date[_ + 'Milliseconds'](),
      o = utc ? 0 : date.getTimezoneOffset(),
      flags = {
        d: d,
        dd: pad(d),
        ddd: dF.i18n.dayNames[D],
        dddd: dF.i18n.dayNames[D + 7],
        m: m + 1,
        mm: pad(m + 1),
        mmm: dF.i18n.monthNames[m],
        mmmm: dF.i18n.monthNames[m + 12],
        yy: String(y).slice(2),
        yyyy: y,
        h: H % 12 || 12,
        hh: pad(H % 12 || 12),
        H: H,
        HH: pad(H),
        M: M,
        MM: pad(M),
        s: s,
        ss: pad(s),
        l: pad(L, 3),
        L: pad(L > 99 ? Math.round(L / 10) : L),
        t: H < 12 ? 'a' : 'p',
        tt: H < 12 ? 'am' : 'pm',
        T: H < 12 ? 'A' : 'P',
        TT: H < 12 ? 'AM' : 'PM',
        Z: utc
          ? 'UTC'
          : (String(date).match(timezone) || [''])
              .pop()!
              .replace(timezoneClip, ''),
        o:
          (o > 0 ? '-' : '+') +
          pad(Math.floor(Math.abs(o) / 60) * 100 + (Math.abs(o) % 60), 4),
        S: ['th', 'st', 'nd', 'rd'][
          d % 10 > 3 ? 0 : ((((d % 100) - (d % 10) != 10) as any) * d) % 10
        ],
      }

    return mask.replace(token, function ($0: string) {
      return $0 in flags ? (flags as any)[$0] : $0.slice(1, $0.length - 1)
    })
  }
})()

// Some common format strings
;(dateFormat as any).masks = {
  default: 'ddd mmm dd yyyy HH:MM:ss',
  shortDate: 'm/d/yy',
  mediumDate: 'mmm d, yyyy',
  longDate: 'mmmm d, yyyy',
  fullDate: 'dddd, mmmm d, yyyy',
  shortTime: 'h:MM TT',
  mediumTime: 'h:MM:ss TT',
  longTime: 'h:MM:ss TT Z',
  isoDate: 'yyyy-mm-dd',
  isoTime: 'HH:MM:ss',
  isoDateTime: "yyyy-mm-dd'T'HH:MM:ss",
  isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'",
}

// Internationalization strings
;(dateFormat as any).i18n = {
  dayNames: [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ],
  monthNames: [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
}

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
    return dateFormat(date, mask, utc)
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
