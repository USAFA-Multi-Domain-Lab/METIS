function toTitleFormat(toFormat: string): string {
  while (toFormat.startsWith(' ')) {
    toFormat = toFormat.substr(1, toFormat.length)
  }
  while (toFormat.endsWith(' ')) {
    toFormat = toFormat.substr(0, toFormat.length - 1)
  }
  while (toFormat.includes(' ')) {
    toFormat = toFormat.replace(' ', '-')
  }
  return toFormat.toLowerCase()
}

export function limit(toLimit: string, maxCharacters: number) {
  if (toLimit.length > maxCharacters) {
    toLimit = toLimit.substr(0, maxCharacters - 3)
    toLimit += '...'
  }
  return toLimit
}

const defaultExports = {
  toTitleFormat,
  limit,
}

export default defaultExports
