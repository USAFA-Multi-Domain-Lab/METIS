import { exec } from 'child_process'
import mongoose, { ConnectOptions } from 'mongoose'
import {
  MONGO_HOST,
  MONGO_PASSWORD,
  MONGO_PORT,
  MONGO_USERNAME,
  SCHEMA_BUILD_NUMBER,
} from '../config'
import { attackMissionData, defensiveMissionData } from './initial-mission-data'
import InfoModel from './models/model-info'
import MissionModel from './models/model-mission'
import UserModel from './models/model-user'

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
      console.error('Failed to query database for default info:')
      console.error(error)
      callbackError(error)
    } else if (info === null) {
      console.log('Info not found.')
      console.log('Creating info...')

      const infoData = {
        infoID: 'default',
        schemaBuildNumber: SCHEMA_BUILD_NUMBER,
      }

      // Creates and saves info
      InfoModel.create(infoData, (error: Error, info: any) => {
        if (error) {
          console.error(
            'Failed to create and store server info in the database:',
          )
          console.error(error)
          callbackError(error)
        } else {
          console.log('Server info created:', info.infoID)
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
  UserModel.findOne({ userID: 'admin' }).exec((error: Error, user: any) => {
    if (error !== null) {
      console.error('Failed to query database for the default user:')
      console.error(error)
      callbackError(error)
    } else if (user === null) {
      console.log('Admin user not found.')
      console.log('Creating admin user...')

      const adminUserData = {
        userID: 'admin',
        firstName: 'N/A',
        lastName: 'N/A',
        password: 'temppass',
      }

      //creates and saves user
      UserModel.create(adminUserData, (error: Error, adminUser: any) => {
        if (error) {
          console.error('Failed to create admin user:')
          console.error(error)
          callbackError(error)
        } else {
          console.log('Admin user created:', adminUser.userID)
          callback()
        }
      })
    } else {
      callback()
    }
  })
}

// Creates multiple missions, if they
// don't exist.
function ensureDefaultMissionsExists(
  callback: () => void = () => {},
  callbackError: (error: Error) => void = () => {},
): void {
  MissionModel.find({}).exec((error: Error, missions: any) => {
    if (error !== null) {
      console.error('Failed to query database for default missions:')
      console.error(error)
      callbackError(error)
    } else if (missions.length === 0) {
      console.log('No missions were found.')
      console.log('Creating both missions...')

      MissionModel.create(attackMissionData, (error: Error, mission: any) => {
        if (error) {
          console.error(`Failed to create ${attackMissionData.name}.`)
          console.error(error)
          callbackError(error)
        } else {
          console.log(`${mission.name} has been created.`)

          MissionModel.create(
            defensiveMissionData,
            (error: Error, mission: any) => {
              if (error) {
                console.error(`Failed to create ${defensiveMissionData.name}.`)
                console.error(error)
                callbackError(error)
              } else {
                console.log(`${mission.name} has been created.`)
                callback()
              }
            },
          )
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
    ensureDefaultUsersExists(() => ensureDefaultMissionsExists(callback)),
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
    command += ` --username ${MONGO_USERNAME} --password ${MONGO_PASSWORD}`
  }

  console.log(`Database is migrating to build ${nextBuildNumber}`)

  exec(command, (error, stdout, stderr) => {
    if (!error) {
      let stdoutSplit: Array<string> = stdout.split(
        `Loading file: ${buildPath}`,
      )

      if (stdoutSplit.length > 1) {
        stdout = stdoutSplit[1]
      }

      console.log(stdout)
      console.log(`Database successfully migrated to build ${nextBuildNumber}`)

      if (nextBuildNumber < targetBuildNumber) {
        buildSchema(nextBuildNumber, targetBuildNumber, callback, callbackError)
      } else {
        callback()
      }
    } else {
      console.error(`Database failed to migrate to ${nextBuildNumber}`)
      console.error(error)
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
      console.error('Failed to query database for current schema build:')
      console.error(error)
    } else if (info !== null) {
      let currentBuildNumber: number = info.schemaBuildNumber
      let targetBuildNumber: number = SCHEMA_BUILD_NUMBER

      if (currentBuildNumber > targetBuildNumber) {
        console.error('Failed to check for schema updates:')
        console.error(
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
      console.error('Failed to check for schema updates. Info data missing.')
      callbackError(
        new Error('Failed to check for schema updates. Info data missing.'),
      )
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

  mongoose.connect(`mongodb://${MONGO_HOST}:${MONGO_PORT}/mdl`, connectOptions)

  connection = mongoose.connection

  // database error handling
  connection.on('error', () => {
    let error: Error = new Error('Failed connection to database')
    console.error(error)
    callbackError(error)
  })

  // logs when server succesfully connects to database
  connection.once('open', () => {
    console.log('Connected to database.')
    ensureDefaultDataExists(
      () => ensureCorrectSchemaBuild(callback, callbackError),
      callbackError,
    )
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
