/**
 * Gets the given environment variable from VITE_*.
 */
function get(key: string, fallback?: string): string {
  const viteKey = `VITE_${key}` as keyof ImportMetaEnv
  const val = import.meta.env[viteKey] as unknown as string | undefined
  return (val ?? fallback ?? '').toString()
}

/**
 * Environment variables available in the client.
 */
export const ENV = {
  MODE: get('MODE'),
  DEV: get('DEV'),
  PROD: get('PROD'),
  BASE_URL: get('BASE_URL'),
  API_URL: get('API_URL'),
  WS_URL: get('WS_URL'),
  PORT: get('PORT'),
  get,
} as const
