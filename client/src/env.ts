// Centralized, typed access to environment variables in the client
// Uses Vite's import.meta.env and supports only Vite (VITE_*) prefixes.

// Common Vite-provided flags
export const MODE = import.meta.env.MODE
export const DEV = import.meta.env.DEV
export const PROD = import.meta.env.PROD
export const BASE_URL = import.meta.env.BASE_URL

// Helper to get a value from VITE_* only
function get(key: string, fallback?: string): string {
  const viteKey = `VITE_${key}` as keyof ImportMetaEnv
  const val = import.meta.env[viteKey] as unknown as string | undefined
  return (val ?? fallback ?? '').toString()
}

// Example well-known vars you might already use. Add more as needed.
export const API_URL = get('API_URL')
export const WS_URL = get('WS_URL')
export const PORT = get('PORT')

// Convenience export for namespaced access
export const ENV = {
  MODE,
  DEV,
  PROD,
  BASE_URL,
  API_URL,
  WS_URL,
  PORT,
  get,
}
