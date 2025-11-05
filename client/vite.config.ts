import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'
import path from 'path'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

/**
 * Prefixes permitted for client-side exposure of
 * environment variables.
 */
const ENV_ALLOWED_PREFIXES = ['VITE_']

export default defineConfig(({ mode }) => {
  let envType: string = ''
  let configDir = path.resolve(__dirname, '../config')

  // Determine the environment type based
  // on Vite's mode.
  switch (mode) {
    case 'development':
      envType = 'dev'
      break
    case 'test':
      envType = 'test'
      break
    case 'production':
    default:
      envType = 'prod'
      break
  }

  // Resolve environment variables based on the
  // determined environment type.
  dotenv.config({
    path: path.join(configDir, `${envType}.defaults.env`),
    override: true,
  })
  dotenv.config({
    path: path.join(configDir, `${envType}.env`),
    override: true,
  })

  // Process loaded environment variables.
  let metisServerPort = process.env.PORT || '8080'
  let envDefinition = Object.fromEntries(
    Object.keys(process.env)
      .filter((k) => ENV_ALLOWED_PREFIXES.some((p) => k.startsWith(p)))
      .map((k) => [`process.env.${k}`, JSON.stringify(process.env[k] ?? '')]),
  ) as Record<string, string>

  return {
    plugins: [react(), tsconfigPaths()],
    resolve: {
      alias: {
        'metis/client': path.resolve(__dirname, 'src'),
        'metis': path.resolve(__dirname, '../shared'),
        'react': path.resolve(__dirname, '../node_modules/react'),
        'react-dom': path.resolve(__dirname, '../node_modules/react-dom'),
      },
    },
    publicDir: path.resolve(__dirname, 'public'),
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: `http://localhost:${metisServerPort}`,
          changeOrigin: true,
        },
        '/socket.io': {
          target: `ws://localhost:${metisServerPort}`,
          changeOrigin: true,
          ws: true,
        },
      },
    },
    build: {
      // Prevents issues building SVG icons.
      assetsInlineLimit: 0,
      sourcemap: true,
    },
    define: {
      ...envDefinition,
    },
  }
})
