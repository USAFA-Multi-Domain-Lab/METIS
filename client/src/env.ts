/**
 * @param key The key of the environment variable needed.
 * @param fallback The fallback value if the environment
 * variable is not set.
 * @returns The resulting environment-variable value.
 */
function get<T extends keyof ImportMetaEnv>(
  key: T,
  fallback?: ImportMetaEnv[T],
): ImportMetaEnv[T] {
  let result = import.meta.env[key]
  return result ?? fallback
}

export default {
  get: get,
  get BASE_URL() {
    return get('BASE_URL')
  },
  get DEV() {
    return get('DEV')
  },
  get MODE() {
    return get('MODE')
  },
  get PROD() {
    return get('PROD')
  },
  get SSR() {
    return get('SSR')
  },
}
