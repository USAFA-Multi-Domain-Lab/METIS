import MongoStore from 'connect-mongo'
import express, { Express } from 'express'
import rateLimit from 'express-rate-limit'
import session from 'express-session'
import expressWs from 'express-ws'
import fs from 'fs'
import MetisDatabase from 'metis/server/database'
import MetisRouter from 'metis/server/http/router'
import { expressLogger, expressLoggingHandler } from 'metis/server/logging'
import { TCommonTargetEnvJson } from 'metis/target-environments'
import mongoose from 'mongoose'
import path from 'path'
import { sys } from 'typescript'
import MetisFileStore from './files'
import ServerTargetEnvironment from './target-environments'
const cookieParser = require('cookie-parser')
const cors = require('cors')
const defaults = require('../defaults')

declare module 'express-session' {
  export interface SessionData {
    userId: string
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
   * The maximum number of http requests allowed per second.
   * @default undefined
   */
  httpRateLimit?: number
  /**
   * The maximum number of websocket messages allowed per second.
   */
  wsRateLimit?: number
  /**
   * The location of the file store.
   * @default "./files/store"
   */
  fileStoreDir?: string
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
   * The express app instance.
   */
  public get expressApp(): Express {
    return this._expressApp
  }

  /**
   * The database instance.
   */
  private _database: MetisDatabase
  /**
   * The database instance.
   */
  public get database(): MetisDatabase {
    return this._database
  }

  /**
   * The file store instance.
   */
  private _fileStore: MetisFileStore
  /**
   * The file store instance.
   */
  public get fileStore(): MetisFileStore {
    return this._fileStore
  }

  /**
   * The port on which to run the server.
   */
  private _port: number
  /**
   * The port on which to run the server.
   */
  public get port(): number {
    return this._port
  }

  /**
   * The name of the MongoDB database to use.
   */
  private _mongoDB: string
  /**
   * The name of the MongoDB database to use.
   */
  public get mongoDB(): string {
    return this._mongoDB
  }

  /**
   * The host of the MongoDB database to use.
   */
  private _mongoHost: string
  /**
   * The host of the MongoDB database to use.
   */
  public get mongoHost(): string {
    return this._mongoHost
  }

  /**
   * The port of the MongoDB database to use.
   */
  private _mongoPort: number
  /**
   * The port of the MongoDB database to use.
   */
  public get mongoPort(): number {
    return this._mongoPort
  }

  /**
   * The username of the MongoDB database to use.
   */
  private _mongoUsername: string | undefined
  /**
   * The username of the MongoDB database to use.
   */
  public get mongoUsername(): string | undefined {
    return this._mongoUsername
  }

  /**
   * The password of the MongoDB database to use.
   */
  private _mongoPassword: string | undefined
  /**
   * The password of the MongoDB database to use.
   */
  public get mongoPassword(): string | undefined {
    return this._mongoPassword
  }

  /**
   * The maximum number of http requests allowed per second.
   */
  private _httpRateLimit: number
  /**
   * The maximum number of http requests allowed per second.
   */
  public get httpRateLimit(): number {
    return this._httpRateLimit
  }

  /**
   * The maximum number of websocket messages allowed per second.
   */
  private _wsRateLimit: number
  /**
   * The maximum number of websocket messages allowed per second.
   */
  public get wsRateLimit(): number {
    return this._wsRateLimit
  }

  /**
   * The location of the file store.
   */
  private _fileStoreDir: string
  /**
   * The location of the file store.
   */
  public get fileStoreDir(): string {
    return this._fileStoreDir
  }

  /**
   * The routers for the server.
   */
  private routers: MetisRouter[] = []

  /**
   * @param options Options for creating the METIS server.
   */
  public constructor(options: IMetisServerOptions = {}) {
    this._expressApp = express()
    this._port = options.port ?? defaults.PORT
    this._mongoDB = options.mongoDB ?? defaults.MONGO_DB
    this._mongoHost = options.mongoHost ?? defaults.MONGO_HOST
    this._mongoPort = options.mongoPort ?? defaults.MONGO_PORT
    this._mongoUsername = options.mongoUsername
    this._mongoPassword = options.mongoPassword
    this._httpRateLimit = options.httpRateLimit ?? defaults.HTTP_RATE_LIMIT
    this._wsRateLimit = options.wsRateLimit ?? defaults.WS_RATE_LIMIT
    this._fileStoreDir = options.fileStoreDir ?? defaults.FILE_STORE_DIR
    this._database = new MetisDatabase(this)
    this._fileStore = new MetisFileStore(this, { directory: this.fileStoreDir })
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
      let { expressApp, database, fileStore } = this

      // Web socket setup.
      expressWs(expressApp)

      // Logger setup.
      expressApp.use(expressLoggingHandler)

      // Database setup.
      await database.connect()

      // File store setup.
      await fileStore.initialize()

      // Grab mongoose connection.
      mongooseConnection = database.mongooseConnection

      if (mongooseConnection === null) {
        console.error('Failed to connect to database.')
        return sys.exit(1)
      }

      // Create the internal (METIS) target environment.
      // Note: This gets added to the registry upon creation.
      new ServerTargetEnvironment(ServerTargetEnvironment.INTERNAL_TARGET_ENV)

      // File path to the target environments.
      let targetEnvDir: string = path.join(
        __dirname,
        '../integration/target-env',
      )
      // Get the target environment JSON.
      let targetEnvJson: TCommonTargetEnvJson[] =
        ServerTargetEnvironment.scan(targetEnvDir)
      // Add each target environment to the registry
      // by creating a new target environment object
      // from the JSON.
      targetEnvJson.forEach(
        (targetEnv) => new ServerTargetEnvironment(targetEnv),
      )

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
      expressApp.use(express.urlencoded({ limit: '10mb', extended: true }))
      expressApp.use(express.json({ limit: '10mb' }))

      // Limits the rate of requests to the server
      expressApp.use(
        rateLimit({
          windowMs: 1000,
          limit: this.httpRateLimit,
        }),
      )

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
      router.map(router.expressRouter, this, () => register(router))
  }

  /**
   * The current build number for the database.
   */
  public static readonly SCHEMA_BUILD_NUMBER: number = 27
  /**
   * The root directory for the METIS server.
   */
  public static readonly APP_DIR = path.join(__dirname)
  /**
   * The path to the environment file.
   */
  public static readonly ENVIRONMENT_FILE_PATH: string = './environment.json'
}
