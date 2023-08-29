import { exec } from 'child_process'
import formatDate from 'dateformat'
import mongoose, { ConnectOptions } from 'mongoose'
import {
  MONGO_DB,
  MONGO_HOST,
  MONGO_PASSWORD,
  MONGO_PORT,
  MONGO_USERNAME,
  SCHEMA_BUILD_NUMBER,
} from '../config'
import { databaseLogger } from '../modules/logging'
import { demoMissionData } from './initial-mission-data'
import InfoModel from './models/model-info'
import MissionModel from './models/model-mission'
import UserModel, { hashPassword } from './models/model-user'

export const ERROR_BAD_DATA: string = 'BadDataError'

const BUILD_DIR: string = './database/builds/'

let connection: mongoose.Connection

// Create server info, if it doesn't exist.
function ensureDefaultInfoExists(
  callback: () => void = () => {},
  callbackError: (error: Error) => void = () => {},
): void {
  InfoModel.findOne({ infoID: 'default' }).exec((error: Error, info: any) => {
    if (error !== null) {
      databaseLogger.error('Failed to query database for default info:')
      databaseLogger.error(error)
      callbackError(error)
    } else if (info === null) {
      databaseLogger.info('Info not found.')
      databaseLogger.info('Creating info...')

      const infoData = {
        infoID: 'default',
        schemaBuildNumber: SCHEMA_BUILD_NUMBER,
      }

      // Creates and saves info
      InfoModel.create(infoData, (error: Error, info: any) => {
        if (error) {
          databaseLogger.error(
            'Failed to create and store server info in the database:',
          )
          databaseLogger.error(error)
          callbackError(error)
        } else {
          databaseLogger.info('Server info created:', info.infoID)
          callback()
        }
      })
    } else {
      callback()
    }
  })
}

// Create admin user, if it doesn't exist.
function ensureDefaultUsersExists(
  callback: () => void = () => {},
  callbackError: (error: Error) => void = () => {},
): void {
  UserModel.findOne({ userID: 'admin' }).exec(
    async (error: Error, user: any) => {
      if (error !== null) {
        databaseLogger.error(
          'Failed to query database for the default admin user:',
        )
        databaseLogger.error(error)
        callbackError(error)
      } else if (user === null) {
        databaseLogger.info('Admin user not found.')
        databaseLogger.info('Creating admin user...')

        let adminUserData = {
          userID: 'admin',
          role: 'admin',
          firstName: 'admin',
          lastName: 'user',
          password: 'temppass',
          needsPasswordReset: false,
        }

        adminUserData.password = await hashPassword(adminUserData.password)

        //creates and saves user
        UserModel.create(adminUserData, (error: Error, adminUser: any) => {
          if (error) {
            databaseLogger.error('Failed to create admin user:')
            databaseLogger.error(error)
            callbackError(error)
          } else {
            databaseLogger.info('Admin user created:', adminUser.userID)
          }
        })
      }
    },
  )

  UserModel.findOne({ userID: 'student1' }).exec(
    async (error: Error, user: any) => {
      if (error !== null) {
        databaseLogger.error(
          'Failed to query database for the default student user:',
        )
        databaseLogger.error(error)
        callbackError(error)
      } else if (user === null) {
        databaseLogger.info('Student user not found.')
        databaseLogger.info('Creating student user...')

        let studentUserData = {
          userID: 'student1',
          role: 'student',
          firstName: 'student',
          lastName: 'user',
          needsPasswordReset: false,
          password: 'password',
        }

        studentUserData.password = await hashPassword(studentUserData.password)

        //creates and saves user
        UserModel.create(studentUserData, (error: Error, studentUser: any) => {
          if (error) {
            databaseLogger.error('Failed to create student user:')
            databaseLogger.error(error)
            callbackError(error)
          } else {
            databaseLogger.info('Student user created:', studentUser.userID)
            callback()
          }
        })
      } else {
        callback()
      }
    },
  )
}

// Creates multiple missions, if they
// don't exist.
function ensureDefaultMissionsExists(
  callback: () => void = () => {},
  callbackError: (error: Error) => void = () => {},
): void {
  MissionModel.find({}).exec((error: Error, missions: any) => {
    if (error !== null) {
      databaseLogger.error('Failed to query database for default missions:')
      databaseLogger.error(error)
      callbackError(error)
    } else if (missions.length === 0) {
      databaseLogger.info('No missions were found.')
      databaseLogger.info('Creating default missions...')

      MissionModel.create(demoMissionData, (error: Error, mission: any) => {
        if (error) {
          databaseLogger.error(`Failed to create ${demoMissionData.name}.`)
          databaseLogger.error(error)
          callbackError(error)
        } else {
          databaseLogger.info(`${mission.name} has been created.`)
          callback()
        }
      })
    } else {
      callback()
    }
  })
}

// This will ensure that the data that by
// default should be in the database exists.
export function ensureDefaultDataExists(
  callback: () => void = () => {},
  callbackError: (error: Error) => void = () => {},
): void {
  ensureDefaultInfoExists(() =>
    ensureDefaultUsersExists(() => {
      ensureDefaultMissionsExists(callback)
    }),
  )
}

// This will generate the file path for
// the given build number.
function generateFilePath(buildNumber: number) {
  let buildNumberAsStr: string = `${buildNumber}`

  while (buildNumberAsStr.length < 6) {
    buildNumberAsStr = '0' + buildNumberAsStr
  }

  return `${BUILD_DIR}build_${buildNumberAsStr}.js`
}

// This will build the schema for the given
// schema build number.
function buildSchema(
  currentBuildNumber: number,
  targetBuildNumber: number,
  callback: () => void = () => {},
  callbackError: (error: Error) => void = () => {},
): void {
  let nextBuildNumber: number = currentBuildNumber + 1
  let buildPath: string = generateFilePath(nextBuildNumber)
  let command: string = `mongosh --host ${MONGO_HOST} --port ${MONGO_PORT} --file ${buildPath}`

  if (MONGO_USERNAME && MONGO_PASSWORD) {
    command += ` --username ${MONGO_USERNAME} --password ${MONGO_PASSWORD} --authenticationDatabase ${MONGO_DB}`
  }

  process.env.MONGO_DB = MONGO_DB

  databaseLogger.info(`Database is migrating to build ${nextBuildNumber}`)
  console.log(`Database is migrating to build ${nextBuildNumber}`)

  exec(command, (error, stdout, stderr) => {
    let stdoutSplit: Array<string> = stdout.split(`Loading file: ${buildPath}`)

    if (stdoutSplit.length > 1) {
      stdout = stdoutSplit[1]
    }

    databaseLogger.info(stdout)
    console.log(stdout)

    if (!error) {
      databaseLogger.info(
        `Database successfully migrated to build ${nextBuildNumber}`,
      )
      console.log(`Database successfully migrated to build ${nextBuildNumber}`)

      if (nextBuildNumber < targetBuildNumber) {
        buildSchema(nextBuildNumber, targetBuildNumber, callback, callbackError)
      } else {
        callback()
      }
    } else {
      databaseLogger.error(`Database failed to migrate to ${nextBuildNumber}`)
      databaseLogger.error(error)
      console.log(`Database failed to migrate to ${nextBuildNumber}`)
      callbackError(error)
    }
  })
}

// This will check to make sure that the schema
// build number specified in the config is the
// same as the one stored in the database. If not,
// the database will be updated until the build
// number is the same.
export function ensureCorrectSchemaBuild(
  callback: () => void = () => {},
  callbackError: (error: Error) => void = () => {},
): void {
  InfoModel.findOne({ infoID: 'default' }).exec((error: Error, info: any) => {
    if (error !== null) {
      databaseLogger.error('Failed to query database for current schema build:')
      databaseLogger.error(error)
    } else if (info !== null) {
      let currentBuildNumber: number = info.schemaBuildNumber
      let targetBuildNumber: number = SCHEMA_BUILD_NUMBER

      if (currentBuildNumber > targetBuildNumber) {
        databaseLogger.error('Failed to check for schema updates:')
        databaseLogger.error(
          'The current schema build number found in the database was newer than ' +
            'the target build number found in the config.',
        )
      } else if (currentBuildNumber < targetBuildNumber) {
        buildSchema(
          currentBuildNumber,
          targetBuildNumber,
          callback,
          callbackError,
        )
      } else {
        callback()
      }
    } else {
      databaseLogger.error(
        'Failed to check for schema updates. Info data missing.',
      )
      callbackError(
        new Error('Failed to check for schema updates. Info data missing.'),
      )
    }
  })
}

// Creates a backup of the database.
function createBackup(
  callback: () => void = () => {},
  callbackError: (error: Error) => void = () => {},
): void {
  const now: Date = new Date()
  const nowFormatted: string = formatDate(now, 'isoDateTime')
  let command: string = `mongodump --host ${MONGO_HOST} --port ${MONGO_PORT} --db ${MONGO_DB} --out ./database/backups/${nowFormatted}`

  if (MONGO_USERNAME && MONGO_PASSWORD) {
    command += ` --username ${MONGO_USERNAME} --password ${MONGO_PASSWORD} --authenticationDatabase ${MONGO_DB}`
  }

  exec(command, (error, stdout, stderr) => {
    if (!error) {
      let stdoutSplit: Array<string> = stdout.split(
        `Loading file: ./database/backup.js`,
      )

      if (stdoutSplit.length > 1) {
        stdout = stdoutSplit[1]
      }

      databaseLogger.info(stdout)

      callback()
    } else {
      databaseLogger.error(error)
      callbackError(error)
    }
  })
}

// This will initialize the database for
// use.
export function initialize(
  callback: () => void = () => {},
  callbackError: (error: Error) => void = () => {},
) {
  let connectOptions: ConnectOptions = {}

  if (MONGO_USERNAME && MONGO_PASSWORD) {
    connectOptions.user = MONGO_USERNAME
    connectOptions.pass = MONGO_PASSWORD
  }

  mongoose.set('strictQuery', true)
  mongoose.connect(
    `mongodb://${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}`,
    connectOptions,
  )

  connection = mongoose.connection

  // database error handling
  connection.on('error', () => {
    let error: Error = new Error('Failed connection to database')
    databaseLogger.error(error)
    callbackError(error)
  })

  // logs when server succesfully connects to database
  connection.once('open', () => {
    databaseLogger.info('Connected to database.')
    createBackup(() => {
      ensureDefaultDataExists(
        () => ensureCorrectSchemaBuild(callback, callbackError),
        callbackError,
      ),
        // Create a backup every 24 hours.
        setInterval(createBackup, 1000 * 60 * 60 * 24)
    }, callbackError)
  })
}

// This will return the global connection
// variable that is set in initialize.
export function getConnection(): mongoose.Connection | null {
  return connection
}

export default {
  initialize,
  getConnection,
}
