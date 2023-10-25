const { createProxyMiddleware } = require('http-proxy-middleware')
const fs = require('fs')
const path = require('path')

// Get default enviornment variable values.
const defaults = require('../../defaults')

// Define the port for the METIS server
// based on the default value.
let METIS_SERVER_PORT = defaults.PORT

// Resolve the path to the environment file.
let environmentFilePath = path.resolve(
  __dirname,
  '../../server/environment.json',
)

// Check if the environment file exists.
if (fs.existsSync(environmentFilePath)) {
  try {
    // Read the environment file.
    let environmentData = fs.readFileSync(environmentFilePath, 'utf8')

    // Parse the environment file into
    // a JSON object.
    environmentData = JSON.parse(environmentData)

    // Grab the port from the environment
    // data if it exists.
    if ('port' in environmentData) {
      METIS_SERVER_PORT = environmentData['port']
    }
  } catch (error) {
    console.error('Error parsing environment file.')
    console.error(error)
    process.exit(1)
  }
}

process.env.REACT_APP_WS_URL = `ws://localhost:${METIS_SERVER_PORT}`

// Export proxy setup function.
module.exports = function (app) {
  // API proxy middleware.
  app.use(
    createProxyMiddleware('/api', {
      target: `http://localhost:${METIS_SERVER_PORT}`,
      changeOrigin: true,
    }),
  )
  // Websocket proxy middleware.
  app.use(
    createProxyMiddleware('/connect', {
      target: `ws://localhost:${METIS_SERVER_PORT}`,
      changeOrigin: true,
      ws: true,
    }),
  )
}
