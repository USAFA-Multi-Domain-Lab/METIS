// -- interfaces --

export interface IClock {
  seconds: number
  minutes: number
  hours: number
}

const dayLength = 1000 * 60 * 60 * 24
const monthTitlesUpper: string[] = [
  'January',
  'Febuary',
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
]
const monthTitlesUpperShort: string[] = monthTitlesUpper.map(
  (monthUpper: string): string => monthUpper.substr(0, 3),
)
const monthTitlesLower: string[] = monthTitlesUpper.map(
  (monthUpper: string): string => monthUpper.toLowerCase(),
)
const daysOfWeekUpper: string[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]
const daysOfWeekUpperShort: string[] = daysOfWeekUpper.map(
  (dayOfWeekUpper: string): string => dayOfWeekUpper.substr(0, 3),
)

export const ONE_MILLISECOND = 1
export const ONE_SECOND = ONE_MILLISECOND * 1000
export const ONE_MINUTE = ONE_SECOND * 60
export const ONE_QUARTER_HOUR = ONE_MINUTE * 15
export const ONE_HOUR = ONE_QUARTER_HOUR * 4
export const ONE_DAY = ONE_HOUR * 24
export const ONE_WEEK = ONE_DAY * 7

function monthAndYearMakeValidDate(
  month: number = 0,
  year: number = 0,
): boolean {
  return (
    month >= 0 &&
    month <= 11 &&
    Number.isInteger(month) &&
    Number.isInteger(year)
  )
}
// returns number of days in the given month for the given year
function getDaysIn(month: number, year: number): number {
  // number of days normally in
  // each month
  let counts: number[] = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  let count: number = 0
  // if month and year are an actual month and year
  if (monthAndYearMakeValidDate(month, year)) {
    // count is set to the count
    // for the given month
    count = counts[month]
    // if the month is febuary
    // on a leap year
    if (month === 1 && year % 4 === 0) {
      // then the count is added to
      count++
    }
  }
  return count
}
//
function makeValidDate(
  day = 1,
  month: number = 0,
  year: number = 0,
  hour: number = 0,
  quarterHour: number = 0,
): boolean {
  let dayCount: number = getDaysIn(month, year)
  return (
    monthAndYearMakeValidDate(month, year) &&
    day > 0 &&
    day <= dayCount &&
    hour >= 0 &&
    hour < 24 &&
    quarterHour >= 0 &&
    quarterHour < 4 &&
    Number.isInteger(day) &&
    Number.isInteger(hour) &&
    Number.isInteger(quarterHour)
  )
}
function isBeforeDate(
  date: Date,
  day: number = 1,
  month: number = 0,
  year: number = 2020,
  hour: number = 24,
  quarterHour: number = 3,
): boolean {
  if (makeValidDate(day, month, year)) {
    let thisDay: number = date.getDate()
    let thisMonth: number = date.getMonth()
    let thisYear: number = date.getFullYear()
    let thisHour: number = date.getHours()
    let thisQuarterHour: number = Math.floor(date.getMinutes() / 15)
    if (year >= thisYear) {
      if (year === thisYear) {
        if (month >= thisMonth) {
          if (month === thisMonth) {
            if (day >= thisDay) {
              if (day === thisDay) {
                if (hour >= thisHour) {
                  if (hour === thisHour) {
                    if (quarterHour >= thisQuarterHour) {
                      return false
                    }
                  } else {
                    return false
                  }
                }
              } else {
                return false
              }
            }
          } else {
            return false
          }
        }
      } else {
        return false
      }
    }
    return true
  }
  return false
}
function matches(
  date: Date,
  day: number,
  month: number,
  year: number,
): boolean {
  if (makeValidDate(day, month, year)) {
    return (
      day === date.getDate() &&
      month === date.getMonth() &&
      year === date.getFullYear()
    )
  }
  return false
}

function formatDateForDisplay(date: Date): string {
  let day: number = date.getDate()
  let dayOfWeek: number = date.getDay()
  let month: number = date.getMonth()
  let hour: number = date.getHours()
  let minute: number = date.getMinutes()
  let dayOfWeekDisplay: string = daysOfWeekUpperShort[dayOfWeek]
  let monthDisplay: string = monthTitlesUpperShort[month]
  let dayDisplay: string = `${day}`
  let hourDisplay: string = `${hour % 12}`
  let minuteDisplay: string = `${minute}`
  let timeOfDayDisplay: string = 'AM'
  if (hour % 12 === 0) {
    hourDisplay = `12`
  }
  if (minute < 10) {
    minuteDisplay = '0' + minuteDisplay
  }
  if (hour >= 12) {
    timeOfDayDisplay = 'PM'
  }
  return `${dayOfWeekDisplay}, ${monthDisplay} ${dayDisplay}, ${hourDisplay}:${minuteDisplay}${timeOfDayDisplay}`
}

function formatForDisplay(
  quarterHour: number,
  hour: number,
  day: number,
  month: number,
  year: number,
): string {
  let minute: number = quarterHour * 15
  let date: Date = new Date(year, month, day, hour, minute)
  return formatDateForDisplay(date)
}

function formatClockForDisplay(clock: IClock) {
  let display: string = ''
  let hasHours: boolean = clock.hours > 0
  let hasMinutes: boolean = clock.hours > 0 || clock.minutes > 0
  if (hasHours) {
    display += clock.hours
    display += ':'
  }
  if (hasMinutes) {
    if (hasHours && clock.minutes < 10) {
      display += '0'
    }
    display += clock.minutes
    display += ':'
    if (clock.seconds < 10) {
      display += '0'
    }
  }
  display += clock.seconds
  display += 's'
  return display
}

// gets the difference of the two dates in seconds
function getTimeElapsed(start: Date, finish: Date): IClock {
  let startInSeconds: number = start.getTime() / 1000
  let finishInSeconds: number = finish.getTime() / 1000
  let totalSeconds: number = finishInSeconds - startInSeconds
  let seconds: number = Math.floor(totalSeconds % 60)
  let minutes: number = Math.floor((totalSeconds / 60) % 60)
  let hours: number = Math.floor(totalSeconds / 60 / 60)
  return {
    seconds,
    minutes,
    hours,
  }
}

const defaultExports = {
  dayLength,
  monthTitlesUpper,
  monthTitlesLower,
  daysOfWeekUpper,
  daysOfWeekUpperShort,
  ONE_MILLISECOND,
  ONE_SECOND,
  ONE_MINUTE,
  ONE_QUARTER_HOUR,
  ONE_HOUR,
  ONE_DAY,
  ONE_WEEK,
  getDaysIn,
  makeValidDate,
  isBeforeDate,
  matches,
  formatForDisplay,
  formatDateForDisplay,
  formatClockForDisplay,
  getTimeElapsed,
}

export default defaultExports
