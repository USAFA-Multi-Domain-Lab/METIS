import MongoStore from 'connect-mongo'
import express, { Express, RequestHandler } from 'express'
import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit'
import session, { Session, SessionData } from 'express-session'
import fs from 'fs'
import http, { Server as HttpServer } from 'http'
import { TMetisBaseComponents } from 'metis/index'
import MetisDatabase from 'metis/server/database'
import MetisRouter from 'metis/server/http/router'
import { expressLogger, expressLoggingHandler } from 'metis/server/logging'
import mongoose from 'mongoose'
import path from 'path'
import { sys } from 'typescript'
import MetisWsServer from './connect'
import MetisFileStore from './files'
import ServerFileReference from './files/references'
import ServerWebSession from './logins/web-sessions'
import ServerMission from './missions'
import ServerMissionAction from './missions/actions'
import ServerActionExecution from './missions/actions/executions'
import ServerExecutionOutcome from './missions/actions/outcomes'
import ServerEffect from './missions/effects'
import ServerMissionFile from './missions/files'
import ServerMissionForce from './missions/forces'
import ServerOutput from './missions/forces/output'
import ServerMissionNode from './missions/nodes'
import ServerMissionPrototype from './missions/nodes/prototypes'
import SessionServer from './sessions'
import ServerSessionMember from './sessions/members'
import ServerTargetEnvironment from './target-environments'
import ServerTarget from './target-environments/targets'
import ServerUser from './users'

const dotenv = require('dotenv')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const packageJson = require('../package.json')

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
   * The HTTP server instance.
   */
  private _httpServer: HttpServer
  /**
   * The HTTP server instance.
   */
  public get httpServer(): HttpServer {
    return this._httpServer
  }

  /**
   * The Socket IO instance.
   */
  private _wsServer: MetisWsServer
  /**
   * The Socket IO instance.
   */
  public get wsServer(): MetisWsServer {
    return this._wsServer
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
   * The duration of the rate limit for the http server.
   */
  private _httpRateLimitDuration: number
  /**
   * The duration of the rate limit for the http server.
   */
  public get httpRateLimitDuration(): number {
    return this._httpRateLimitDuration
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
   * The duration of the rate limit for the web socket server.
   */
  private _wsRateLimitDuration: number
  /**
   * The duration of the rate limit for the web socket server.
   */
  public get wsRateLimitDuration(): number {
    return this._wsRateLimitDuration
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
   *
   */

  /**
   * The session middleware for the server responsible
   * for enabling and managing sessions.
   */
  private _sessionMiddleware: RequestHandler
  /**
   * The session middleware for the server responsible
   * for enabling and managing sessions.
   */
  public get sessionMiddleware(): RequestHandler {
    return this._sessionMiddleware
  }

  /**
   * The routers for the server.
   */
  private routers: MetisRouter[] = []

  /**
   * The rate limiter for the express server.
   */
  private limiter: RateLimitRequestHandler

  /**
   * @param options Options for creating the METIS server.
   */
  public constructor(options: Partial<TMetisServerOptions> = {}) {
    // Create a completed options object, which
    // combines the options provided in the environment
    // with the options provided in the constructor.
    let completedOptions: TMetisServerOptions = {
      ...MetisServer.createOptionsFromEnvironment(),
      ...options,
    }

    // Create third-party server objects.
    this._expressApp = express()
    this._httpServer = http.createServer(this.expressApp)
    this._wsServer = new MetisWsServer(this)

    // Parse the options and store them in the class.
    this._port = completedOptions.port
    this._mongoDB = completedOptions.mongoDB
    this._mongoHost = completedOptions.mongoHost
    this._mongoPort = completedOptions.mongoPort
    this._mongoUsername = completedOptions.mongoUsername
    this._mongoPassword = completedOptions.mongoPassword
    this._httpRateLimit = completedOptions.httpRateLimit
    this._httpRateLimitDuration = completedOptions.httpRateLimitDuration * 1000 // ms
    this._wsRateLimit = completedOptions.wsRateLimit
    this._wsRateLimitDuration = completedOptions.wsRateLimitDuration
    this._fileStoreDir = completedOptions.fileStoreDir

    // Create database and file store objects.
    this._database = new MetisDatabase(this)
    this._fileStore = new MetisFileStore(this, { directory: this.fileStoreDir })

    // Temporary session middleware until configured
    // with the database connection.
    this._sessionMiddleware = () => {}

    // Create the rate limiter.
    this.limiter = rateLimit({
      windowMs: this.httpRateLimitDuration,
      limit: this.httpRateLimit,
    })
  }

  /**
   * Serves the Express server.
   * @resolves when the server is open on the configured port.
   * @rejects if the server fails to start.
   */
  public async serve(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        let httpServer: HttpServer = this.httpServer
        let port: number = this.port

        // Initialize express app.
        await this.initialize()

        // Serve express app.
        httpServer.listen(port, () => {
          console.log(`Started server on port ${port}.`)
          resolve()
        })
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
      let { expressApp, database, fileStore, wsServer } = this

      // Register target environments.
      ServerTargetEnvironment.scan()
      // Validate target IDs.
      ServerTarget.validateTargetIds(
        ServerTargetEnvironment.METIS_TARGET_ENV_ID,
      )

      // Logger setup.
      expressApp.use(expressLoggingHandler)

      // Database setup.
      await database.connect()

      // Grab and confirm mongoose connection.
      mongooseConnection = database.mongooseConnection
      if (mongooseConnection === null) {
        console.error('Failed to connect to database.')
        return sys.exit(1)
      }

      // Create the store that will be used for
      // all (express) web sessions.
      ServerWebSession.createSessionStore(
        MongoStore.create({
          client: mongooseConnection.getClient(),
          touchAfter: 24 * 3600, // lazy update after 24 hours
        }),
      )

      // Configure sessions.
      this._sessionMiddleware = session({
        name: MetisServer.WEB_SESSION_COOKIE_NAME,
        secret: '3c8V3DoMuJxjoife0asdfasdf023asd9isfd',
        resave: false,
        saveUninitialized: false,
        store: ServerWebSession.store,
      })

      // sets up pug as the view engine
      expressApp.set('view engine', 'pug')
      expressApp.set('views', path.join(__dirname, '/views'))

      // set the port
      expressApp.set('port', this.port)

      // activates third-party middleware
      expressApp.use(cors())
      expressApp.use(cookieParser())
      expressApp.use(this._sessionMiddleware)
      expressApp.use(express.urlencoded({ limit: '10mb', extended: true }))
      expressApp.use(express.json({ limit: '10mb' }))

      // rate limiter
      expressApp.use(this.limiter)

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

      // Handle lower level errors.
      process.on('uncaughtException', (err: any) => {
        if ('code' in err && err.code === 'ERR_HTTP_HEADERS_SENT') {
          expressLogger.warn('Suppressed uncaughtException:', err.message)
        } else {
          console.error('Unhandled exception:', err)
          process.exit(1) // Optional: Exit for critical errors
        }
      })

      // Initialize web socket server.
      wsServer.initialize()

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
   * The name of the METIS project.
   */
  public static readonly PROJECT_NAME: string = packageJson.name
  /**
   * The description of the METIS project.
   */
  public static readonly PROJECT_DESCRIPTION: string = packageJson.description
  /**
   * The current version of METIS.
   */
  public static readonly PROJECT_VERSION: string = packageJson.version
  /**
   * The current build number for the database.
   */
  public static readonly SCHEMA_BUILD_NUMBER: number = 49
  /**
   * The root directory for the METIS server.
   */
  public static readonly APP_DIR = path.join(__dirname)
  /**
   * The path to the environment file.
   */
  public static readonly ENVIRONMENT_FILE_PATH: string = '../environment.json'

  /**
   * The name of the cookie used to store the web session ID.
   */
  public static readonly WEB_SESSION_COOKIE_NAME = 'connect.sid'

  /**
   * Creates METIS options from the environment.
   * @returns The METIS options created from the environment.
   * @throws If environment variables are missing are invalid.
   */
  private static createOptionsFromEnvironment(): TMetisServerOptions {
    switch (process.env.METIS_ENV_TYPE) {
      case 'docker':
        dotenv.config({ path: '../config/docker.defaults.env', override: true })
        dotenv.config({ path: '../config/docker.env', override: true })
        break
      case 'dev':
        dotenv.config({ path: '../config/dev.defaults.env', override: true })
        dotenv.config({ path: '../config/dev.env', override: true })
        break
      case 'test':
        dotenv.config({ path: '../config/test.defaults.env', override: true })
        dotenv.config({ path: '../config/test.env', override: true })
        break
      case 'prod':
      default:
        dotenv.config({ path: '../config/prod.defaults.env', override: true })
        dotenv.config({ path: '../config/prod.env', override: true })
        break
    }

    const requiredKeys = [
      'PORT',
      'MONGO_DB',
      'MONGO_HOST',
      'MONGO_PORT',
      'HTTP_RATE_LIMIT',
      'HTTP_RATE_LIMIT_DURATION',
      'WS_RATE_LIMIT',
      'WS_RATE_LIMIT_DURATION',
      'FILE_STORE_DIR',
    ] as const

    requiredKeys.forEach((key) => {
      if (!process.env[key]) {
        throw new Error(
          `Missing required environment variable: "${key}"\nIf \`defaults.env\` was modified, please undo changes. This file should not be modified by non-developers.`,
        )
      }
    })

    try {
      return {
        port: parseInt(process.env.PORT!),
        mongoDB: process.env.MONGO_DB!,
        mongoHost: process.env.MONGO_HOST!,
        mongoPort: parseInt(process.env.MONGO_PORT!),
        mongoUsername: process.env.MONGO_USERNAME,
        mongoPassword: process.env.MONGO_PASSWORD,
        httpRateLimit: parseInt(process.env.HTTP_RATE_LIMIT!),
        httpRateLimitDuration: parseInt(process.env.HTTP_RATE_LIMIT_DURATION!),
        wsRateLimit: parseInt(process.env.WS_RATE_LIMIT!),
        wsRateLimitDuration: parseInt(process.env.WS_RATE_LIMIT_DURATION!),
        fileStoreDir: process.env.FILE_STORE_DIR!,
      }
    } catch (error) {
      console.error('Failed to load environment variables.')
      throw error
    }
  }
}

/* -- TYPES -- */

declare module 'http' {
  export interface IncomingMessage {
    session: Session & Partial<SessionData>
  }
}

declare module 'express-session' {
  export interface SessionData {
    userId: string
  }
}

/**
 * Server registry of METIS components types.
 * @note This is used for all server-side METIS
 * component classes.
 */
export interface TMetisServerComponents extends TMetisBaseComponents {
  session: SessionServer
  member: ServerSessionMember
  user: ServerUser
  targetEnv: ServerTargetEnvironment
  target: ServerTarget
  fileReference: ServerFileReference
  mission: ServerMission
  prototype: ServerMissionPrototype
  missionFile: ServerMissionFile
  force: ServerMissionForce
  output: ServerOutput
  node: ServerMissionNode
  action: ServerMissionAction
  execution: ServerActionExecution
  outcome: ServerExecutionOutcome
  effect: ServerEffect
}

/**
 * Options for creating the METIS server.
 */
export interface TMetisServerOptions {
  /**
   * The port on which to run the server.
   * @default 8080
   */
  port: number
  /**
   * The name of the MongoDB database to use.
   * @default "metis"
   */
  mongoDB: string
  /**
   * The host of the MongoDB database to use.
   * @default "localhost"
   */
  mongoHost: string
  /**
   * The port of the MongoDB database to use.
   * @default 27017
   */
  mongoPort: number
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
  httpRateLimit: number
  /**
   * The duration of the rate limit for the http server.
   * @default 1 (second)
   */
  httpRateLimitDuration: number
  /**
   * The maximum number of websocket messages allowed per second.
   */
  wsRateLimit: number
  /**
   * The duration of the rate limit for the web socket server.
   * @default 1 (second)
   */
  wsRateLimitDuration: number
  /**
   * The location of the file store.
   * @default "./files/store"
   */
  fileStoreDir: string
}
