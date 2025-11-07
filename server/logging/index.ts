import type { Express, Handler as ExpressHandler } from 'express'
import expressWinston from 'express-winston'
import type { Logger } from 'winston'
import winston from 'winston'
import { Console as ConsoleTransport } from 'winston/lib/winston/transports'
import { MetisServer } from '../MetisServer'

/**
 * A logger used by all loggers before they
 * are properly initialized by {@link initializeLoggers}.
 */
const preInitLogger: Logger = winston.createLogger({
  transports: [new ConsoleTransport()],
})

/**
 * A request handler used before proper
 * initialization in {@link initializeLoggers}.
 */
const preInitHandler: ExpressHandler = expressWinston.logger({
  transports: [new ConsoleTransport()],
})

/**
 * Logs database-related events.
 * @note Properly initialized in {@link initializeLoggers}.
 */
export let databaseLogger: Logger = preInitLogger

/**
 * Logs session-related events.
 * @note Properly initialized in {@link initializeLoggers}.
 */
export let sessionLogger: Logger = preInitLogger

/**
 * Logs express-related events.
 * @note Properly initialized in {@link initializeLoggers}.
 */
export let expressLogger: Logger = preInitLogger

/**
 * Express middleware handler for logging requests.
 * @note Properly initialized in {@link initializeLoggers}.
 */
export let expressLoggingHandler: ExpressHandler = preInitHandler

/**
 * Logs target-environment related events.
 * @note Properly initialized in {@link initializeLoggers}.
 */
export let targetEnvLogger: Logger = preInitLogger

/**
 * Logs test-related events.
 * @note Properly initialized in {@link initializeLoggers}.
 */
export let testLogger: Logger = preInitLogger

/**
 * Creates a Winston transport for logging
 * with Metis-specific settings.
 * @param options Options for the transport.
 * @returns The Winston transport.
 */
function createMetisTransport(
  options?: winston.transports.FileTransportOptions | undefined,
) {
  const isErrorFile = options?.level === 'error'
  return new winston.transports.File({
    maxsize: 5 * 1024 * 1024, // 5 MB
    maxFiles: isErrorFile ? 2 : 5, // Fewer rotations for error logs
    tailable: true,
    ...options,
  })
}

/**
 * Properly initializes all loggers.
 */
export function initializeLoggers(expressApp: Express): void {
  // Create loggers,
  databaseLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.json(),
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
    ),
    defaultMeta: { service: 'user-service' },
    transports: [
      createMetisTransport({
        filename: MetisServer.resolvePath('logs/database-error.log'),
        level: 'error',
        format: winston.format.combine(
          winston.format.json(),
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.prettyPrint(),
        ),
      }),
      createMetisTransport({
        filename: MetisServer.resolvePath('logs/database.log'),
      }),
    ],
  })

  sessionLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.json(),
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
    ),
    defaultMeta: { service: 'user-service' },
    transports: [
      createMetisTransport({
        filename: MetisServer.resolvePath('logs/session-error.log'),
        level: 'error',
        format: winston.format.combine(
          winston.format.json(),
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.prettyPrint(),
        ),
      }),
      createMetisTransport({
        filename: MetisServer.resolvePath('logs/session.log'),
      }),
    ],
  })

  expressLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.json(),
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
    ),
    defaultMeta: { service: 'user-service' },
    transports: [
      createMetisTransport({
        filename: MetisServer.resolvePath('logs/express-error.log'),
        level: 'error',
        format: winston.format.combine(
          winston.format.json(),
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.prettyPrint(),
        ),
      }),
      createMetisTransport({
        filename: MetisServer.resolvePath('logs/express.log'),
      }),
    ],
  })

  targetEnvLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.json(),
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
    ),
    defaultMeta: { service: 'user-service' },
    transports: [
      createMetisTransport({
        filename: MetisServer.resolvePath('logs/target-env-error.log'),
        level: 'error',
        format: winston.format.combine(
          winston.format.json(),
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.prettyPrint(),
        ),
      }),
      createMetisTransport({
        filename: MetisServer.resolvePath('logs/target-env.log'),
      }),
    ],
  })

  testLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.json(),
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
    ),
    defaultMeta: { service: 'user-service' },
    transports: [
      createMetisTransport({
        filename: MetisServer.resolvePath('logs/test-error.log'),
        level: 'error',
        format: winston.format.combine(
          winston.format.json(),
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.prettyPrint(),
        ),
      }),
      createMetisTransport({
        filename: MetisServer.resolvePath('logs/test.log'),
      }),
    ],
  })

  // Attach the express logging handler to the express app.
  expressLoggingHandler = expressWinston.logger({
    transports: [
      createMetisTransport({
        filename: MetisServer.resolvePath('logs/express-error.log'),
        level: 'error',
        format: winston.format.combine(
          winston.format.json(),
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.prettyPrint(),
        ),
      }),
      createMetisTransport({
        filename: MetisServer.resolvePath('logs/express.log'),
      }),
    ],
    format: winston.format.combine(
      winston.format.json(),
      winston.format.timestamp(),
    ),
    meta: true, // optional: control whether you want to log the meta data about the request (default to true)
    msg: '{{res.statusCode}}, {{res.statusMessage}}; HTTP {{req.method}} {{req.url}}', // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
    expressFormat: false, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
    colorize: false, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
    ignoreRoute: function (req, res) {
      return false
    }, // optional: allows to skip some log messages based on request and/or response
  })
  expressApp.use(expressLoggingHandler)
}

export default {
  databaseLogger,
  sessionLogger,
  expressLogger,
  expressLoggingHandler,
  targetEnvLogger,
  testLogger,
}
