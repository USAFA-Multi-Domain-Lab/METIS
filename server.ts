// third-party modules
import express from 'express'

import config from './config'

const app = express()

config.configure(app)

// route imports
const indexRoute = require('./routes/routes-index')
const usersApiRoute = require('./routes/api/v1/routes-users')

// sets the paths that routes load at
app.use('/api/v1/users/', usersApiRoute)
app.use('/api/v1/', (request, response) => {
  response.status(404)
  response.render('error/v-not-found')
})

app.use('*', indexRoute)

// page not found handling
app.use((request: any, response: any) => {
  response.status(404)
  response.render('error/v-not-found')
})

// last line of defense error handling (generic server error)
app.use((error: any, request: any, response: any, next: any) => {
  if (!error.status) {
    error.status = 500
  }
  console.log(error)

  response.locals.error = error
  response.render('error/v-server-error')
})

// establishes server to listen at the given port
const server: any = app.listen(app.get('port'), () => {
  console.log(`Started server on port ${server.address().port}.`)
})
