import express from 'express'
import config from './config'
import { expressLogger } from './modules/logging'

const app = express()

// Runs the express server.
export function startServer(callback: () => void = () => {}): void {
  config.configure(
    app,
    () => {
      // route imports
      const indexRoute = require('./routes/routes-index')
      const infoRoute = require('./routes/api/v1/routes-info')
      const usersApiRoute = require('./routes/api/v1/routes-users')
      const missionsApiRoute = require('./routes/api/v1/routes-missions')
      const testApiRoute = require('./test/api/v1/routes-test')

      // sets the paths that routes load at
      app.use('/api/v1/info/', infoRoute)
      app.use('/api/v1/users/', usersApiRoute)
      app.use('/api/v1/missions/', missionsApiRoute)
      app.use('/api/v1/test/', testApiRoute)
      app.use('/api/v1/', (request, response) => {
        response.status(404)
        response.render('error/v-not-found')
      })

      app.use('*', indexRoute)

      // page not found handling
      app.use((request: any, response: any) => {
        response.status(404)
        return response.render('error/v-not-found')
      })

      // last line of defense error handling (generic server error)
      app.use((error: any, request: any, response: any, next: any) => {
        if (!error.status) {
          error.status = 500
        }
        expressLogger.error(error)

        response.status(500)
        response.locals.error = error
        return response.render('error/v-server-error')
      })

      // establishes server to listen at the given port
      const server: any = app.listen(app.get('port'), () => {
        console.log(`Started server on port ${server.address().port}.`)

        return callback()
      })
    },
    (error: Error) => {
      console.error('START UP FAILED SHUTTING DOWN')
    },
  )
}

if (process.env.environment !== 'TEST') {
  startServer()
}

export default {
  app,
  startServer,
}
