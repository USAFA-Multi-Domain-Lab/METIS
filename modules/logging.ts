import winston from 'winston'
import expressWinston from 'express-winston'

export const databaseLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.json(),
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
  ),
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.File({
      filename: './logs/database-error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.json(),
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.colorize(),
        winston.format.prettyPrint(),
      ),
    }),
    new winston.transports.File({ filename: './logs/database.log' }),
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
    new winston.transports.File({
      filename: './logs/express-error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.json(),
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.colorize(),
        winston.format.prettyPrint(),
      ),
    }),
    new winston.transports.File({ filename: './logs/express.log' }),
  ],
})

export const expressLoggingHandler = expressWinston.logger({
  transports: [
    new winston.transports.File({
      filename: './logs/express-error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.json(),
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.colorize(),
        winston.format.prettyPrint(),
      ),
    }),
    new winston.transports.File({ filename: './logs/express.log' }),
  ],
  format: winston.format.combine(
    winston.format.json(),
    winston.format.timestamp(),
  ),
  meta: true, // optional: control whether you want to log the meta data about the request (default to true)
  msg: 'HTTP {{req.method}} {{req.url}}', // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
  expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
  colorize: false, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
  ignoreRoute: function (req, res) {
    return false
  }, // optional: allows to skip some log messages based on request and/or response
})

export default {
  databaseLogger,
  expressLogger,
  expressLoggingHandler,
}
