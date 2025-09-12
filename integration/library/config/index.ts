import { getCallerTargetEnv } from '../toolbox/files'

/**
 * @returns Environment variables for the current target
 * environment.
 */
export function loadConfig() {
  let environment = getCallerTargetEnv()
  let { _id } = environment
  let variablePrefix = _id.toUpperCase().replace(/-/g, '_') + '_'
  let config: Record<string, string> = {}

  for (let originalKey in process.env) {
    if (
      originalKey.startsWith(variablePrefix) &&
      process.env[originalKey] !== undefined
    ) {
      let segments = originalKey.replace(variablePrefix, '').split('_')
      let newKey = ''

      for (let i = 0; i < segments.length; i++) {
        if (i === 0) {
          newKey += segments[i].toLowerCase()
        } else {
          newKey +=
            segments[i].charAt(0).toUpperCase() +
            segments[i].slice(1).toLowerCase()
        }
      }

      config[newKey] = process.env[originalKey].toString()
    }
  }

  return config
}
