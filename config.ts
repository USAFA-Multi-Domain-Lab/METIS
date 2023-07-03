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
import { expressLoggingHandler } from './modules/logging'
import { User } from './src/modules/users'
import { ServerMissionSession } from './modules/mission-control'

declare module 'express-session' {
  export interface SessionData {
    sessionID: string
    user: User
    missionSession: ServerMissionSession
  }
}

/* -- config-variables | default-values -- */

export let SCHEMA_BUILD_NUMBER: number = 11

export let PORT: number = 8080

export let MONGO_DB: string = 'mdl'
export let MONGO_HOST = 'localhost'
export let MONGO_PORT = 27017
export let MONGO_USERNAME: string | undefined
export let MONGO_PASSWORD: string | undefined
export let API_KEY: string = ''
export let PLC_API_HOST: string = ''

export const APP_DIR = path.join(__dirname)

/* -- config-variables | environment-override -- */

export let environmentFilePath: string = './environment.json'

// changes the environment for when the unit tests are being run
if (process.env.environment === 'TEST') {
  environmentFilePath = './environment-test.json'
  MONGO_DB = 'mdl-test'
}

if (fs.existsSync(environmentFilePath)) {
  let environmentData: any = fs.readFileSync(environmentFilePath, 'utf8')

  environmentData = JSON.parse(environmentData)

  // server config
  if ('PORT' in environmentData) {
    PORT = environmentData['PORT']
  }

  // database config
  if ('MONGO_DB' in environmentData) {
    MONGO_DB = environmentData['MONGO_DB']
  }
  if ('MONGO_HOST' in environmentData) {
    MONGO_HOST = environmentData['MONGO_HOST']
  }
  if ('MONGO_PORT' in environmentData) {
    MONGO_PORT = environmentData['MONGO_PORT']
  }
  if ('MONGO_USERNAME' in environmentData) {
    MONGO_USERNAME = environmentData['MONGO_USERNAME']
  }
  if ('MONGO_PASSWORD' in environmentData) {
    MONGO_PASSWORD = environmentData['MONGO_PASSWORD']
  }
  if ('API_KEY' in environmentData) {
    API_KEY = environmentData['API_KEY']
  }
  if ('PLC_API_HOST' in environmentData) {
    PLC_API_HOST = environmentData['PLC_API_HOST']
  }
}

/* -- functions -- */

// This will configure the express app
// for use.
export function configure(
  app: Express,
  callback: () => void = () => {},
  callbackError: (error: Error) => void = () => {},
): void {
  let connection: mongoose.Connection | null

  // Logger setup.
  app.use(expressLoggingHandler)

  // Database setup.
  database.initialize(() => {
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

    // This will do clean up when the application
    // terminates.
    process.on('SIGINT', () => {
      // Deletes temp folder.
      fs.rmdirSync(path.join(APP_DIR, 'temp'), { recursive: true })
      process.exit()
    })

    callback()
  }, callbackError)
}

const defaultExports = {
  MONGO_DB,
  PORT,
  MONGO_HOST,
  PLC_API_HOST,
  API_KEY,
  configure,
}

export default defaultExports
