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
  return {
    plugins: [react(), tsconfigPaths()],
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
      'process.env': env,
    },
  }
})
