import express, { Express } from 'express'
import session from 'express-session'
import path from 'path'
import fs from 'fs'
const cookieParser = require('cookie-parser')
const cors = require('cors')
import MongoStore from 'connect-mongo'
import database from './database/database'
import mongoose from 'mongoose'
import { sys } from 'typescript'

declare module 'express-session' {
  export interface SessionData {
    userID: string
  }
}

// -- config-variables | default-values --

export let PORT: number = 3000

export let MONGO_HOST = 'mongodb://localhost:27017/mdl'

// -- config-variables | environment-override --

if (fs.existsSync('./environment.json')) {
  let environmentData: any = fs.readFileSync('./environment.json', 'utf8')

  environmentData = JSON.parse(environmentData)

  // server config
  if ('PORT' in environmentData) {
    PORT = environmentData['PORT']
  }

  // database config
  if ('MONGO_HOST' in environmentData) {
    MONGO_HOST = environmentData['MONGO_HOST']
  }
}

// This will configure the express app
// for use.
export function configure(app: Express): void {
  let connection: mongoose.Connection | null

  database.initialize()

  connection = database.getConnection()

  if (connection === null) {
    console.error('Failed to connect to database.')
    return sys.exit(1)
  }

  // sets up pug as the view engine
  app.set('view engine', 'pug')
  app.set('views', path.join(__dirname, '/views'))

  // set the port
  app.set('port', PORT)

  // activates third-party middleware
  app.use(cors())
  app.use(cookieParser())
  app.use(
    session({
      secret: '3c8V3DoMuJxjoife0asdfasdf023asd9isfd',
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        client: connection.getClient(),
      }),
    }),
  )
  app.use(express.urlencoded({ extended: false }))
  app.use(express.json())

  // links the file path to css and resource files
  app.use(express.static('build'))
}

const defaultExports = {
  PORT,
  MONGO_HOST,
  configure,
}

export default defaultExports
