import express, { Express } from 'express'
import { expressLogger, expressLoggingHandler } from 'metis/server/logging'
import expressWs from 'express-ws'
import session from 'express-session'
import path from 'path'
import fs from 'fs'
const cookieParser = require('cookie-parser')
const cors = require('cors')
import MongoStore from 'connect-mongo'
import MetisDatabase from 'metis/server/database'
import mongoose from 'mongoose'
import { sys } from 'typescript'
import MetisRouter from 'metis/server/http/router'
const defaults = require('../defaults')

declare module 'express-session' {
  export interface SessionData {
    userID: string
  }
}

/**
 * Options for creating the METIS server.
 */
export interface IMetisServerOptions {
  /**
   * The port on which to run the server.
   * @default 8080
   */
  port?: number
  /**
   * The name of the MongoDB database to use.
   * @default "metis"
   */
  mongoDB?: string
  /**
   * The host of the MongoDB database to use.
   * @default "localhost"
   */
  mongoHost?: string
  /**
   * The port of the MongoDB database to use.
   * @default 27017
   */
  mongoPort?: number
  /**
   * The username of the MongoDB database to use. Defaults to undefined.
   * @default undefined
   */
  mongoUsername?: string
  /**
   * The password of the MongoDB database to use.
   * @default undefined
   */
  mongoPassword?: string
  /**
   * The API key for the Cyber City API.
   * @default undefined
   */
  cyberCityApiKey?: string
  /**
   * The host of the Cyber City API.
   * @default undefined
   */
  cyberCityApiHost?: string
  /**
   * The host of the ASCOT API.
   * @default undefined
   */
  ascotApiHost?: string
}

/**
 * Manages an Express web server for METIS.
 */
export default class MetisServer {
  /**
   * The express app instance.
   */
  private _expressApp: Express
  /**
   * The database instance.
   */
  private _database: MetisDatabase
  /**
   * The port on which to run the server.
   */
  private _port: number
  /**
   * The name of the MongoDB database to use.
   */
  private _mongoDB: string
  /**
   * The host of the MongoDB database to use.
   */
  private _mongoHost: string
  /**
   * The port of the MongoDB database to use.
   */
  private _mongoPort: number
  /**
   * The username of the MongoDB database to use.
   */
  private _mongoUsername: string | undefined
  /**
   * The password of the MongoDB database to use.
   */
  private _mongoPassword: string | undefined
  /**
   * The API key for the Cyber City API.
   */
  private _cyberCityApiKey: string | undefined
  /**
   * The host of the Cyber City API.
   */
  private _cyberCityApiHost: string | undefined
  /**
   * The host of the ASCOT API.
   */
  private _ascotApiHost: string | undefined
  /**
   * The routers for the server.
   */
  private routers: Array<MetisRouter> = []

  /**
   * The express app instance.
   */
  public get expressApp(): Express {
    return this._expressApp
  }
  /**
   * The database instance.
   */
  public get database(): MetisDatabase {
    return this._database
  }
  /**
   * The port on which to run the server.
   */
  public get port(): number {
    return this._port
  }
  /**
   * The name of the MongoDB database to use.
   */
  public get mongoDB(): string {
    return this._mongoDB
  }
  /**
   * The host of the MongoDB database to use.
   */
  public get mongoHost(): string {
    return this._mongoHost
  }
  /**
   * The port of the MongoDB database to use.
   */
  public get mongoPort(): number {
    return this._mongoPort
  }
  /**
   * The username of the MongoDB database to use.
   */
  public get mongoUsername(): string | undefined {
    return this._mongoUsername
  }
  /**
   * The password of the MongoDB database to use.
   */
  public get mongoPassword(): string | undefined {
    return this._mongoPassword
  }
  /**
   * The API key for the Cyber City API.
   */
  public get cyberCityApiKey(): string | undefined {
    return this._cyberCityApiKey
  }
  /**
   * The host of the Cyber City API.
   */
  public get cyberCityApiHost(): string | undefined {
    return this._cyberCityApiHost
  }
  /**
   * The host of the ASCOT API.
   */
  public get ascotApiHost(): string | undefined {
    return this._ascotApiHost
  }

  /**
   * @param options Options for creating the METIS server.
   */
  public constructor(options: IMetisServerOptions = {}) {
    this._expressApp = express()
    this._database = new MetisDatabase(this)
    this._port = options.port ?? defaults.PORT
    this._mongoDB = options.mongoDB ?? defaults.MONGO_DB
    this._mongoHost = options.mongoHost ?? defaults.MONGO_HOST
    this._mongoPort = options.mongoPort ?? defaults.MONGO_PORT
    this._mongoUsername = options.mongoUsername
    this._mongoPassword = options.mongoPassword
    this._cyberCityApiKey = options.cyberCityApiKey
    this._cyberCityApiHost = options.cyberCityApiHost
    this._ascotApiHost = options.ascotApiHost
  }

  /**
   * Serves the Express server. Resolves when the server is open on the configured port.
   */
  public async serve(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        let expressApp: Express = this.expressApp

        // Initialize express app.
        await this.initialize()

        // Serve express app.
        const server: any = this.expressApp.listen(
          expressApp.get('port'),
          () => {
            console.log(`Started server on port ${server.address().port}.`)
            resolve()
          },
        )
      } catch (error) {
        console.error('START UP FAILED SHUTTING DOWN')
        reject(error)
      }
    })
  }

  /**
   * Initializes the server for use.
   * @returns A promise that resolves once the server is initialized and ready to be served.
   */
  private initialize(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      let mongooseConnection: mongoose.Connection | null
      let { expressApp, database } = this

      // Web socket setup.
      expressWs(expressApp)

      // Logger setup.
      expressApp.use(expressLoggingHandler)

      // Database setup.
      await database.connect()

      // Grab mongoose connection.
      mongooseConnection = database.mongooseConnection

      if (mongooseConnection === null) {
        console.error('Failed to connect to database.')
        return sys.exit(1)
      }

      // sets up pug as the view engine
      expressApp.set('view engine', 'pug')
      expressApp.set('views', path.join(__dirname, '/views'))

      // set the port
      expressApp.set('port', this.port)

      // activates third-party middleware
      expressApp.use(cors())
      expressApp.use(cookieParser())
      expressApp.use(
        session({
          secret: '3c8V3DoMuJxjoife0asdfasdf023asd9isfd',
          resave: false,
          saveUninitialized: false,
          store: MongoStore.create({
            client: mongooseConnection.getClient(),
          }),
        }),
      )
      expressApp.use(express.urlencoded({ extended: false }))
      expressApp.use(express.json())

      // links the file path to css and resource files
      expressApp.use(express.static(path.resolve(__dirname, '../client/build')))

      // This will do clean up when the application
      // terminates.
      process.on('SIGINT', () => {
        // Deletes temp folder.
        fs.rmdirSync(path.join(MetisServer.APP_DIR, 'temp'), {
          recursive: true,
        })
        process.exit()
      })

      this.mapRouters()

      expressApp.use('/api/v1/', (request, response) => {
        response.status(404)
        response.render('error/v-not-found')
      })

      // page not found handling
      expressApp.use((request: any, response: any) => {
        response.status(404)
        return response.render('error/v-not-found')
      })

      // last line of defense error handling (generic server error)
      expressApp.use((error: any, request: any, response: any, next: any) => {
        if (!error.status) {
          error.status = 500
        }
        expressLogger.error(error)

        response.status(500)
        response.locals.error = error
        return response.render('error/v-server-error')
      })

      resolve()
    })
  }

  /**
   * Register a router to the server.
   */
  public addRouter(router: MetisRouter): void {
    this.routers.push(router)
  }

  /**
   * Maps the added routers to the server.
   */
  private mapRouters(): void {
    const register = (router: MetisRouter) =>
      this.expressApp.use(router.path, router.expressRouter)

    for (let router of this.routers)
      router.map(router.expressRouter, () => register(router))
  }

  /**
   * The current build number for the database.
   */
  public static readonly SCHEMA_BUILD_NUMBER: number = 16
  /**
   * The root directory for the METIS server.
   */
  public static readonly APP_DIR = path.join(__dirname)
  /**
   * The path to the environment file.
   */
  public static readonly ENVIRONMENT_FILE_PATH: string = './environment.json'
}
