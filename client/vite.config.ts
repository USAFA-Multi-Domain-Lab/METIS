import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'
import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

// Load environment variables similar to CRA proxy setup
dotenv.config({
  path: path.resolve(__dirname, '../config/dev.defaults.env'),
  override: true,
})
dotenv.config({
  path: path.resolve(__dirname, '../config/dev.env'),
  override: true,
})

const METIS_SERVER_PORT = process.env.PORT || '8080'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const allowedPrefixes = ['VITE_']
  const defineEnv = Object.fromEntries(
    Object.keys(process.env)
      .filter((k) => allowedPrefixes.some((p) => k.startsWith(p)))
      .map((k) => [`process.env.${k}`, JSON.stringify(process.env[k] ?? '')]),
  ) as Record<string, string>

  const envDir = path.resolve(__dirname, '../config')
  const envPrefix = ['VITE_']

  return {
    plugins: [react(), tsconfigPaths()],
    envDir,
    envPrefix,
    resolve: {
      alias: {
        src: path.resolve(__dirname, 'src'),
        shared: path.resolve(__dirname, '../shared'),
      },
    },
    publicDir: path.resolve(__dirname, 'public'),
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: `http://localhost:${METIS_SERVER_PORT}`,
          changeOrigin: true,
        },
        '/socket.io': {
          target: `ws://localhost:${METIS_SERVER_PORT}`,
          changeOrigin: true,
          ws: true,
        },
      },
    },
    build: {
      sourcemap: true,
    },
    define: {
      ...defineEnv,
    },
  }
})
