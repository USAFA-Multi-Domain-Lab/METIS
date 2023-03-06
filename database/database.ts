import { exec } from 'child_process'
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
import { attackMissionData, defensiveMissionData } from './initial-mission-data'
import { radarAssetData } from './models/initial-asset-data'
import AssetModel from './models/model-asset'
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
  UserModel.findOne({ userID: 'admin' }).exec((error: Error, user: any) => {
    if (error !== null) {
      databaseLogger.error('Failed to query database for the default user:')
      databaseLogger.error(error)
      callbackError(error)
    } else if (user === null) {
      databaseLogger.info('Admin user not found.')
      databaseLogger.info('Creating admin user...')

      const adminUserData = {
        userID: 'admin',
        firstName: 'N/A',
        lastName: 'N/A',
        password: 'temppass',
      }

      //creates and saves user
      UserModel.create(adminUserData, (error: Error, adminUser: any) => {
        if (error) {
          databaseLogger.error('Failed to create admin user:')
          databaseLogger.error(error)
          callbackError(error)
        } else {
          databaseLogger.info('Admin user created:', adminUser.userID)
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
      databaseLogger.error('Failed to query database for default missions:')
      databaseLogger.error(error)
      callbackError(error)
    } else if (missions.length === 0) {
      databaseLogger.info('No missions were found.')
      databaseLogger.info('Creating both missions...')

      MissionModel.create(attackMissionData, (error: Error, mission: any) => {
        if (error) {
          databaseLogger.error(`Failed to create ${attackMissionData.name}.`)
          databaseLogger.error(error)
          callbackError(error)
        } else {
          databaseLogger.info(`${mission.name} has been created.`)

          MissionModel.create(
            defensiveMissionData,
            (error: Error, mission: any) => {
              if (error) {
                databaseLogger.error(
                  `Failed to create ${defensiveMissionData.name}.`,
                )
                databaseLogger.error(error)
                callbackError(error)
              } else {
                databaseLogger.info(`${mission.name} has been created.`)
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

// Creates a default asset
// if none exist.
function ensureDefaultAssetsExists(
  callback: () => void = () => {},
  callbackError: (error: Error) => void = () => {},
): void {
  AssetModel.find({})
    .populate('mechanisms mechanisms.states')
    .exec((error: Error, assets: any) => {
      if (error !== null) {
        databaseLogger.error('Failed to query database for default assets:')
        databaseLogger.error(error)
        callbackError(error)
      } else if (assets.length === 0) {
        databaseLogger.info('No assets were found.')
        databaseLogger.info('Creating radar asset...')

        AssetModel.create(radarAssetData, (error: Error) => {
          if (error) {
            databaseLogger.error(`Failed to create ${radarAssetData.name}.`)
            databaseLogger.error(error)
            callbackError(error)
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
      ensureDefaultMissionsExists(() => ensureDefaultAssetsExists(callback))
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

  databaseLogger.info(`Database is migrating to build ${nextBuildNumber}`)

  exec(command, (error, stdout, stderr) => {
    if (!error) {
      let stdoutSplit: Array<string> = stdout.split(
        `Loading file: ${buildPath}`,
      )

      if (stdoutSplit.length > 1) {
        stdout = stdoutSplit[1]
      }

      databaseLogger.info(stdout)
      databaseLogger.info(
        `Database successfully migrated to build ${nextBuildNumber}`,
      )

      if (nextBuildNumber < targetBuildNumber) {
        buildSchema(nextBuildNumber, targetBuildNumber, callback, callbackError)
      } else {
        callback()
      }
    } else {
      databaseLogger.error(`Database failed to migrate to ${nextBuildNumber}`)
      databaseLogger.error(error)
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
