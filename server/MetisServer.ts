import { BooleanToolbox } from '@shared/toolbox/booleans/BooleanToolbox'
import MongoStore from 'connect-mongo'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import dotenv from 'dotenv'
import type { Express, RequestHandler } from 'express'
import express from 'express'
import type { RateLimitRequestHandler } from 'express-rate-limit'
import rateLimit from 'express-rate-limit'
import type { Store } from 'express-session'
import session from 'express-session'
import fs from 'fs'
import type mongoose from 'mongoose'
import { randomBytes } from 'node:crypto'
import type { Server as HttpServer } from 'node:http'
import http from 'node:http'
import https from 'node:https'
import path from 'path'
import { sys } from 'typescript'
import packageJson from '../package.json'
import type { MetisRouter } from './api/v1/library/MetisRouter'
import { MetisWsServer } from './connect/MetisWsServer'
import { MetisDatabase } from './database/MetisDatabase'
import { MetisFileStore } from './files/MetisFileStore'
import { expressLogger, initializeLoggers } from './logging'
import { ImportMigrationBuilder } from './missions/imports/ImportMigrationBuilder'
import { ServerTarget } from './target-environments/ServerTarget'
import { ServerTargetEnvironment } from './target-environments/ServerTargetEnvironment'
import { TargetEnvSandboxing } from './target-environments/TargetEnvSandboxing'

/**
 * Manages an Express web server for METIS.
 */
export class MetisServer {
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
  public readonly fileStore: MetisFileStore

  /**
   * Helps perform migrations for imported missions with
   * outdated data.
   */
  public readonly importMigrationBuilder: ImportMigrationBuilder

  /**
   * The environment type in which METIS is running.
   */
  private _envType: string
  /**
   * The environment type in which METIS is running.
   */
  public get envType(): string {
    return this._envType
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
   * Whether database backups should be created automatically on startup and on a schedule.
   */
  private _backupsEnabled: boolean
  /**
   * Whether database backups should be created automatically on startup and on a schedule.
   */
  public get backupsEnabled(): boolean {
    return this._backupsEnabled
  }

  /**
   * The path to the SSL key file (if any).
   */
  private _sslKeyPath: string | undefined
  /**
   * The path to the SSL key file (if any).
   */
  public get sslKeyPath(): string | undefined {
    return this._sslKeyPath
  }

  /**
   * The path to the SSL cert file (if any).
   */
  private _sslCertPath: string | undefined
  /**
   * The path to the SSL cert file (if any).
   */
  public get sslCertPath(): string | undefined {
    return this._sslCertPath
  }

  /**
   * The maximum number of failed login attempts before lockout.
   */
  private _maxLoginAttempts: number
  /**
   * The maximum number of failed login attempts before lockout.
   */
  public get maxLoginAttempts(): number {
    return this._maxLoginAttempts
  }

  /**
   * The duration of login lockout in milliseconds.
   */
  private _loginLockoutDuration: number
  /**
   * The duration of login lockout in milliseconds.
   */
  public get loginLockoutDuration(): number {
    return this._loginLockoutDuration
  }

  /**
   * The time window in milliseconds to track failed attempts.
   */
  private _loginAttemptWindow: number
  /**
   * The time window in milliseconds to track failed attempts.
   */
  public get loginAttemptWindow(): number {
    return this._loginAttemptWindow
  }

  /**
   * Whether the `X-Forwarded-*` headers set by a reverse proxy are trusted.
   */
  private _trustProxy: boolean
  /**
   * Whether the `X-Forwarded-*` headers set by a reverse proxy are trusted.
   * @note These headers come from the client, so this stays off unless a
   * proxy that overwrites them sits in front of the server.
   */
  public get trustProxy(): boolean {
    return this._trustProxy
  }

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

    // Parse the options and store them in the class.
    this._envType = completedOptions.envType
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
    this._backupsEnabled = completedOptions.backupsEnabled
    this._sslKeyPath = completedOptions.sslKeyPath
    this._sslCertPath = completedOptions.sslCertPath
    this._maxLoginAttempts = completedOptions.maxLoginAttempts
    this._loginLockoutDuration = completedOptions.loginLockoutDuration * 1000 // ms
    this._loginAttemptWindow = completedOptions.loginAttemptWindow * 1000 // ms
    this._trustProxy = completedOptions.trustProxy

    // Create third-party server objects.
    this._expressApp = express()
    // HTTPS only in production if certs are provided
    if (this.envType === 'prod' && this.sslKeyPath && this.sslCertPath) {
      const key = fs.readFileSync(this.sslKeyPath)
      const cert = fs.readFileSync(this.sslCertPath)
      this._httpServer = https.createServer({ key, cert }, this.expressApp)
      console.log('SSL certificates found, running with HTTPS protocol.')
    } else {
      this._httpServer = http.createServer(this.expressApp)
      if (this.envType === 'prod') {
        console.warn('SSL certificates not found, running with HTTP protocol.')
      }
    }
    this._wsServer = new MetisWsServer(this)

    // Create specialized helpers.
    this._database = new MetisDatabase(this)
    this.fileStore = new MetisFileStore(this, { directory: this.fileStoreDir })
    this.importMigrationBuilder = new ImportMigrationBuilder()

    // Temporary session middleware until configured
    // with the database connection.
    this._sessionMiddleware = () => {}

    // Create the rate limiter.
    this.limiter = rateLimit({
      windowMs: this.httpRateLimitDuration,
      limit: this.httpRateLimit,
      handler: (request, response) => {
        expressLogger.error(
          `Rate limit exceeded for session ID ${request.sessionID} from IP ${request.ip}`,
        )
        response.sendStatus(429)
      },
    })
  }

  /**
   * Initializes and starts web server.
   * @resolves when the server is open on the configured port.
   * @rejects if the server fails to start.
   */
  public async start(): Promise<void> {
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
   * Stops the HTTP server
   * @returns
   */
  public async close(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        await this.database.close()
        this.httpServer.close((err) => {
          if (err) throw err
          console.log('HTTP server closed successfully.')
          resolve()
        })
      } catch (error) {
        console.error('Error during server shutdown:', error)
        reject(error)
      }
    })
  }

  /**
   * Initializes the server for use.
   * @returns A promise that resolves once the server is initialized and ready to be served.
   */
  private initialize(): Promise<void> {
    return new Promise<void>(async (resolve) => {
      let mongooseConnection: mongoose.Connection | null
      let { expressApp, database, wsServer } = this

      // Logger setup.
      initializeLoggers(expressApp)

      // Initialize target-environment sandboxing.
      TargetEnvSandboxing.initialize()
      // Register target environments.
      ServerTargetEnvironment.scan()
      // Validate target IDs.
      ServerTarget.validateTargetIds(
        ServerTargetEnvironment.METIS_TARGET_ENV_ID,
      )

      // Initialize import migrations before connecting to the database,
      // since the connection triggers ensureDefaultMissionsExists which
      // uses the migration builder immediately.
      this.importMigrationBuilder.initialize()

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
      MetisServer.createSessionStore(
        MongoStore.create({
          client: mongooseConnection.getClient(),
          collectionName: MetisServer.WEB_SESSION_COLLECTION_NAME,
          touchAfter: 24 * 3600, // lazy update after 24 hours
        }),
      )

      // Discard the sessions kept from an earlier run, since the logins
      // those sessions name did not survive the restart.
      await MetisServer.clearStoredSessions(mongooseConnection)

      // Configure sessions.
      this._sessionMiddleware = session({
        name: MetisServer.WEB_SESSION_COOKIE_NAME,
        secret: MetisServer.createSessionSecret(),
        resave: false,
        saveUninitialized: false,
        store: MetisServer.sessionStore,
        cookie: {
          // Keep the cookie away from page scripts, so nothing running on a
          // page can read the session out of the browser.
          httpOnly: true,
          // Only hand the cookie over an encrypted connection. This is
          // resolved per request rather than once at startup, so it also
          // covers a proxy that terminates TLS and forwards plain HTTP.
          // Marking it secure while serving plain HTTP stops browsers
          // storing it at all, so it has to follow the real protocol.
          secure: 'auto',
          // Leave the cookie off requests started by other sites, while still
          // sending it when someone follows a link into METIS.
          sameSite: 'lax',
        },
      })

      // sets up pug as the view engine
      expressApp.set('view engine', 'pug')
      expressApp.set('views', path.join(MetisServer.APP_DIR, 'views'))

      // set the port
      expressApp.set('port', this.port)

      // Read the protocol a reverse proxy reports the client used, so that
      // requests arriving over HTTPS are recognized as secure even though
      // the proxy forwards them as plain HTTP (Only allows 1 proxy).
      expressApp.set('trust proxy', this.trustProxy ? 1 : false)

      // activates third-party middleware
      expressApp.use(cors())
      expressApp.use(cookieParser())
      expressApp.use(this._sessionMiddleware)
      expressApp.use(express.urlencoded({ limit: '10mb', extended: true }))
      expressApp.use(express.json({ limit: '10mb' }))

      // rate limiter
      expressApp.use(this.limiter)

      // links the file path to css and resource files
      // Serve built client (Vite outputs to dist)
      expressApp.use(express.static(MetisServer.resolvePath('../client/dist')))

      // Make the MetisServer instance accessible in request handlers.
      expressApp.use((request, response, next) => {
        response.locals.metis = this
        next()
      })

      // This will do clean up when the application
      // terminates.
      process.on('SIGINT', () => {
        // Deletes temp folder.
        fs.rmdirSync(MetisServer.resolvePath('temp'), {
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
      expressApp.use(
        (
          error: any,
          request: TExpressRequest,
          response: TExpressResponse,
          next: any,
        ) => {
          expressLogger.error(
            `Error encountered during request to ${request.path}:`,
            error,
          )

          // Default the status to 500, if not set.
          if (!error.status) {
            error.status = 500
          }
          // All 500 errors should have a generic message
          // to avoid leaking server details.
          if (error.status === 500) {
            error.message =
              'Something went wrong on our end. Please try again later.'
          }

          // For API routes, send JSON response.
          if (request.path.startsWith('/api/')) {
            return response.status(error.status).json({
              error: {
                status: error.status,
                message: error.message,
              },
            })
          }
          // For web routes, render error page.
          else {
            response.status(error.status)
            response.locals.error = error
            return response.render('error/v-server-error')
          }
        },
      )

      // Handle lower level errors.
      process.on('uncaughtException', (err: any) => {
        if ('code' in err && err.code === 'ERR_HTTP_HEADERS_SENT') {
          expressLogger.warn('Suppressed uncaughtException:', err.message)
        } else {
          console.error('Unhandled exception:', err)
          process.exit(1) // Optional: Exit for critical errors
        }
      })

      // Defense-in-depth: log unhandled promise rejections rather than let
      // them escalate. Without this handler, Node's default policy promotes
      // an unhandled rejection to an uncaught exception, tripping the handler
      // above and exiting the process. A single stray async rejection (e.g.
      // from a request handler) should not take the whole server down.
      process.on('unhandledRejection', (reason: any) => {
        console.error('Unhandled promise rejection:', reason)
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
    const register = (router: MetisRouter) => {
      this.expressApp.use(router.path, router.expressRouter)
    }

    for (let router of this.routers) {
      router.map(router.expressRouter, this, () => register(router))
    }
  }

  /**
   * Reference to the Express session store instance.
   * Set once during server initialization.
   */
  private static _sessionStore: Store | null = null
  /**
   * Gets the Express session store instance.
   */
  public static get sessionStore(): Store {
    if (!this._sessionStore) {
      throw new Error(
        'The express session store has not been initialized. Call MetisServer.createSessionStore() first.',
      )
    }
    return this._sessionStore
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
  public static readonly SCHEMA_BUILD_NUMBER: number = 58

  /**
   * The root directory for the METIS server.
   */
  public static readonly APP_DIR: string = __dirname

  /**
   * The name of the cookie used to store the web session ID.
   */
  public static readonly WEB_SESSION_COOKIE_NAME = 'connect.sid'

  /**
   * The name of the database collection that holds the web sessions.
   */
  public static readonly WEB_SESSION_COLLECTION_NAME = 'sessions'

  /**
   * Resolves the given paths with {@link path.resolve} relative
   * to the METIS server app directory ({@link MetisServer.APP_DIR}).
   * @param paths The paths to resolve.
   * @returns The resolved path.
   */
  public static resolvePath(...paths: string[]): string {
    return path.resolve(MetisServer.APP_DIR, ...paths)
  }

  /**
   * Creates the session store for the {@link MetisServer}.
   * @param store The Express session store instance.
   * @note This should only be called once on server startup.
   */
  public static createSessionStore(store: Store): void {
    this._sessionStore = store
  }

  /**
   * Removes every web session held in the database.
   * @param mongooseConnection The connection holding the web session
   * collection.
   * @resolves When the sessions have been removed, or when they could not be
   * removed and the failure has been logged.
   * @note This should only be called once on server startup.
   * @note Logins are held in memory and start out empty every time the server
   * runs, while the sessions in the database outlive the server process.
   * Sessions kept from an earlier run therefore name users who are no longer
   * logged in, and a later login attempt would settle its conflict against
   * one of those users, disconnecting whoever holds that user's login now.
   * Those users are already logged out once the server restarts, so removing
   * their sessions takes away nothing they could still use.
   * @note The session documents are removed rather than their collection
   * being dropped, so that the index that expires old sessions stays in
   * place.
   */
  public static async clearStoredSessions(
    mongooseConnection: mongoose.Connection,
  ): Promise<void> {
    try {
      await mongooseConnection
        .collection(MetisServer.WEB_SESSION_COLLECTION_NAME)
        .deleteMany({})
    } catch (error: any) {
      expressLogger.error(
        'Failed to remove the stored web sessions:',
        error.message || error,
      )
    }
  }

  /**
   * Creates the secret used to sign web session cookies.
   * @returns A newly generated secret.
   * @note The signature made with this secret is what proves a session cookie
   * was handed out by this server, so the secret has to be unguessable and
   * must never be logged or sent to a client. It only signs the session ID
   * that the cookie carries; the session itself is kept in the database.
   * @note A new secret is made every time the server runs, which leaves the
   * cookies from an earlier run unusable. That costs nothing here, because
   * the sessions those cookies point to are removed on startup anyway.
   * @note This ties the server to running as a single process. A second
   * process would generate its own secret and reject the cookies signed by
   * this one.
   * @see {@link MetisServer.clearStoredSessions}
   */
  private static createSessionSecret(): string {
    return randomBytes(32).toString('hex')
  }

  /**
   * Loads environment variables from a .env file in
   * the config directory.
   * @param fileName The name of the .env file to load,
   * not including the extension.
   */
  private static loadEnv(fileName: string): void {
    if (fileName === 'docker') {
      dotenv.config({
        path: MetisServer.resolvePath(`../.env`),
        override: true,
      })
    } else {
      dotenv.config({
        path: MetisServer.resolvePath(`../config/${fileName}.env`),
        override: true,
      })
    }
  }

  /**
   * Creates METIS options from the environment.
   * @returns The METIS options created from the environment.
   * @throws If environment variables are missing are invalid.
   */
  private static createOptionsFromEnvironment(): TMetisServerOptions {
    let envType: string = process.env.METIS_ENV_TYPE ?? 'prod'

    MetisServer.loadEnv(`${envType}.defaults`)
    MetisServer.loadEnv(`${envType}`)

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
      'DB_BACKUPS_ENABLED',
      'MAX_LOGIN_ATTEMPTS',
      'LOGIN_LOCKOUT_DURATION',
      'LOGIN_ATTEMPT_WINDOW',
      'TRUST_PROXY',
    ] as const
    const numericKeys = [
      'PORT',
      'MONGO_PORT',
      'HTTP_RATE_LIMIT',
      'HTTP_RATE_LIMIT_DURATION',
      'WS_RATE_LIMIT',
      'WS_RATE_LIMIT_DURATION',
      'MAX_LOGIN_ATTEMPTS',
      'LOGIN_LOCKOUT_DURATION',
      'LOGIN_ATTEMPT_WINDOW',
    ] as const

    requiredKeys.forEach((key) => {
      if (!process.env[key]) {
        throw new Error(
          `Missing required environment variable: "${key}"\nIf \`defaults.env\` was modified, please undo changes. This file should not be modified by non-developers.`,
        )
      }
    })
    numericKeys.forEach((key) => {
      let value = process.env[key]?.trim() ?? ''
      if (!/^\d+$/.test(value)) {
        throw new Error(
          `Invalid environment variable: "${key}" must be a whole number, but was "${value}"\nIf \`defaults.env\` was modified, please undo changes. This file should not be modified by non-developers.`,
        )
      }
    })

    try {
      return {
        envType,
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
        backupsEnabled: BooleanToolbox.parse(process.env.DB_BACKUPS_ENABLED!),
        sslKeyPath: process.env.SSL_KEY_PATH,
        sslCertPath: process.env.SSL_CERT_PATH,
        maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS!),
        loginLockoutDuration: parseInt(process.env.LOGIN_LOCKOUT_DURATION!),
        loginAttemptWindow: parseInt(process.env.LOGIN_ATTEMPT_WINDOW!),
        trustProxy: BooleanToolbox.parse(process.env.TRUST_PROXY!),
      }
    } catch (error) {
      console.error('Failed to load environment variables.')
      throw error
    }
  }
}
