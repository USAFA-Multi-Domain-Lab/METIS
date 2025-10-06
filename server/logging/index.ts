import expressWinston from 'express-winston'
import winston from 'winston'

/**
 * Creates a Winston transport for logging
 * with Metis-specific settings.
 * @param options Options for the transport.
 * @returns The Winston transport.
 */
const createMetisTransport = (
  options?: winston.transports.FileTransportOptions | undefined,
) => {
  const isErrorFile = options?.level === 'error'
  return new winston.transports.File({
    maxsize: 5 * 1024 * 1024, // 5 MB
    maxFiles: isErrorFile ? 2 : 5, // Fewer rotations for error logs
    tailable: true,
    ...options,
  })
}

export const databaseLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.json(),
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
  ),
  defaultMeta: { service: 'user-service' },
  transports: [
    createMetisTransport({
      filename: './logs/database-error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.json(),
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.prettyPrint(),
      ),
    }),
    createMetisTransport({ filename: './logs/database.log' }),
  ],
})

export const sessionLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.json(),
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
  ),
  defaultMeta: { service: 'user-service' },
  transports: [
    createMetisTransport({
      filename: './logs/session-error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.json(),
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.prettyPrint(),
      ),
    }),
    createMetisTransport({ filename: './logs/session.log' }),
  ],
})

export const expressLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.json(),
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
  ),
  defaultMeta: { service: 'user-service' },
  transports: [
    createMetisTransport({
      filename: './logs/express-error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.json(),
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.prettyPrint(),
      ),
    }),
    createMetisTransport({ filename: './logs/express.log' }),
  ],
})

export const expressLoggingHandler = expressWinston.logger({
  transports: [
    createMetisTransport({
      filename: './logs/express-error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.json(),
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.prettyPrint(),
      ),
    }),
    createMetisTransport({ filename: './logs/express.log' }),
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

export const plcApiLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.json(),
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
  ),
  defaultMeta: { service: 'user-service' },
  transports: [
    createMetisTransport({
      filename: './logs/plc-api-error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.json(),
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.prettyPrint(),
      ),
    }),
    createMetisTransport({ filename: './logs/plc-api.log' }),
  ],
})

export const testLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.json(),
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
  ),
  defaultMeta: { service: 'user-service' },
  transports: [
    createMetisTransport({
      filename: './logs/test-error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.json(),
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.prettyPrint(),
      ),
    }),
    createMetisTransport({ filename: './logs/test.log' }),
  ],
})

export default {
  databaseLogger,
  sessionLogger,
  expressLogger,
  expressLoggingHandler,
  plcApiLogger,
  testLogger,
}
