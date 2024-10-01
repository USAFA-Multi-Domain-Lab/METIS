import { exec } from 'child_process'
import formatDate from 'dateformat'
import MetisServer from 'metis/server'
import { demoMissionData } from 'metis/server/database/initial-mission-data'
import InfoModel from 'metis/server/database/models/info'
import MissionModel from 'metis/server/database/models/missions'
import UserModel, { hashPassword } from 'metis/server/database/models/users'
import { databaseLogger } from 'metis/server/logging'
import mongoose, { ConnectOptions } from 'mongoose'
import {
  adminUserData,
  instructorUserData,
  studentUserData,
} from './initial-user-data'

/**
 * Represents a connection to the Metis database.
 */
export default class MetisDatabase {
  /**
   * The Mongoose database connection.
   */
  private _mongooseConnection: mongoose.Connection | null
  /**
   * The Mongoose database connection.
   */
  public get mongooseConnection(): mongoose.Connection | null {
    return this._mongooseConnection
  }

  /**
   * The Metis server instance.
   */
  private _server: MetisServer
  /**
   * The Metis server instance.
   */
  public get server(): MetisServer {
    return this._server
  }

  /**
   * @param server The Metis server instance.
   */
  public constructor(server: MetisServer) {
    this._mongooseConnection = null
    this._server = server
  }

  /**
   * Establishes a Mongoose connection.
   * @returns A promise that resolves when the connection is established.
   */
  public async connect(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // Collect info.
      let { server } = this
      let { mongoHost, mongoPort, mongoDB, mongoUsername, mongoPassword } =
        server
      let connectOptions: ConnectOptions = {
        user: mongoUsername,
        pass: mongoPassword,
      }
      let mongooseConnection: mongoose.Connection

      // Configure mongoose connection.
      mongoose.set('strictQuery', true)

      // Connect to database.
      mongoose.connect(
        `mongodb://${mongoHost}:${mongoPort}/${mongoDB}`,
        connectOptions,
      )

      // Grab new connection and store it
      // globally.
      mongooseConnection = mongoose.connection
      this._mongooseConnection = mongooseConnection

      // Handle a successful connection to the database.
      mongooseConnection.once('open', async () => {
        try {
          databaseLogger.info('Connected to database.')
          // Create backup of database before use.
          await this.createBackup()
          // Ensure that the schema build is correct.
          await this.ensureCorrectSchemaBuild()
          // Ensure that the default data exists.
          await this.ensureDefaultDataExists()

          try {
            // Schedule a backup every 24 hours
            // while server is running.
            setInterval(() => this.createBackup(), 1000 * 60 * 60 * 24)
          } catch (error) {
            databaseLogger.error('Failed to perform scheduled database backup:')
            databaseLogger.error(error)
          }
          // Resolve.
          resolve()
        } catch (error) {
          reject(error)
        }
      })

      // Handle errors when connecting to database.
      mongooseConnection.on('error', () => {
        let error: Error = new Error('Failed connection to database')
        databaseLogger.error(error)
        reject(error)
      })
    })
  }

  /**
   * Creates a backup of the database.
   * @returns A promise that resolves when the backup is created.
   */
  public async createBackup(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const { server } = this
      const { mongoHost, mongoPort, mongoDB, mongoUsername, mongoPassword } =
        server
      const now: Date = new Date()
      const nowFormatted: string = formatDate(now, 'isoDateTime')
      let command: string = `mongodump --host ${mongoHost} --port ${mongoPort} --db ${mongoDB} --out ./database/backups/${nowFormatted}`

      if (mongoUsername !== undefined && mongoPassword !== undefined) {
        command += ` --username ${mongoUsername} --password ${mongoPassword} --authenticationDatabase ${mongoDB}`
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

          resolve()
        } else {
          databaseLogger.error('Failed to create database backup:')
          databaseLogger.error(error)
          reject(error)
        }
      })
    })
  }

  /**
   * This will ensure that the database is populated with necessary default data.
   * @returns A promise that resolves once the default data is ensured to exist.
   */
  private async ensureDefaultDataExists(): Promise<void> {
    // Call sub-function for each database
    // collection.
    await this.ensureDefaultInfoExists()
    await this.ensureDefaultUsersExists()
    await this.ensureDefaultMissionsExists()
  }

  /**
   * This will ensure that the info collection is populated with necessary default data.
   * @returns A promise that resolves once the default data is ensured to exist.
   */
  private async ensureDefaultInfoExists(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      InfoModel.findOne().exec((error: Error, info: any) => {
        if (error !== null) {
          databaseLogger.error('Failed to query database for default info:')
          databaseLogger.error(error)
          reject(error)
        } else if (info === null) {
          databaseLogger.info('Info not found.')
          databaseLogger.info('Creating info...')

          const infoData = {
            schemaBuildNumber: MetisServer.SCHEMA_BUILD_NUMBER,
          }

          // Creates and saves info
          InfoModel.create(infoData, (error: Error, info: any) => {
            if (error) {
              databaseLogger.error(
                'Failed to create and store server info in the database:',
              )
              databaseLogger.error(error)
              reject(error)
            } else {
              databaseLogger.info('Server info created:', info.infoID)
              resolve()
            }
          })
        } else {
          resolve()
        }
      })
    })
  }

  /**
   * This will ensure that the users collection is populated with necessary default data.
   * @returns A promise that resolves once the default data is ensured to exist.
   */
  private async ensureDefaultUsersExists(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      let awaitingResolve: number = 3

      function resolveOne() {
        // Subtract from awaitingResolve.
        awaitingResolve--

        // If awaitingResolve has reached  0,
        // resolve the promise.
        if (awaitingResolve <= 0) {
          resolve()
        }
      }

      // Check if a student user exists.
      UserModel.findOne({
        accessId: studentUserData.accessId,
      }).exec(async (error: Error, studentUser: any) => {
        if (error !== null) {
          databaseLogger.error('Failed to query database for student user:')
          databaseLogger.error(error)
          reject(error)
        } else if (studentUser === null) {
          databaseLogger.info('Student user not found.')
          databaseLogger.info('Creating student user...')

          if (studentUserData.password) {
            // Hash student user password.
            studentUserData.password = await hashPassword(
              studentUserData.password,
            )
          }

          // Create student user.
          let newStudentUser = new UserModel(studentUserData)
          newStudentUser.save((error: Error) => {
            if (error) {
              databaseLogger.error(
                'Failed to create student user in the database:',
              )
              databaseLogger.error(error)
              reject(error)
            } else {
              databaseLogger.info(
                'Student user created:',
                newStudentUser.username,
              )
              resolveOne()
            }
          })
        } else {
          resolveOne()
        }
      })

      // Check if a instructor user exists.
      UserModel.findOne({
        accessId: instructorUserData.accessId,
      }).exec(async (error: Error, instructorUser: any) => {
        if (error !== null) {
          databaseLogger.error('Failed to query database for instructor user:')
          databaseLogger.error(error)
          reject(error)
        } else if (instructorUser === null) {
          databaseLogger.info('Instructor user not found.')
          databaseLogger.info('Creating instructor user...')

          if (instructorUserData.password) {
            // Hash instructor user password.
            instructorUserData.password = await hashPassword(
              instructorUserData.password,
            )
          }

          // Create instructor user.
          let newInstructorUser = new UserModel(instructorUserData)
          newInstructorUser.save((error: Error) => {
            if (error) {
              databaseLogger.error(
                'Failed to create instructor user in the database:',
              )
              databaseLogger.error(error)
              reject(error)
            } else {
              databaseLogger.info(
                'Instructor user created:',
                newInstructorUser.username,
              )
              resolveOne()
            }
          })
        } else {
          resolveOne()
        }
      })

      // Check if an admin user exists.
      UserModel.findOne({
        accessId: adminUserData.accessId,
      }).exec(async (error: Error, adminUser: any) => {
        if (error !== null) {
          databaseLogger.error('Failed to query database for admin user:')
          databaseLogger.error(error)
          reject(error)
        } else if (adminUser === null) {
          databaseLogger.info('Admin user not found.')
          databaseLogger.info('Creating admin user...')

          if (adminUserData.password) {
            // Hash admin user password.
            adminUserData.password = await hashPassword(adminUserData.password)
          }

          // Create admin user.
          let newAdminUser = new UserModel(adminUserData)
          newAdminUser.save((error: Error) => {
            if (error) {
              databaseLogger.error(
                'Failed to create admin user in the database:',
              )
              databaseLogger.error(error)
              reject(error)
            } else {
              databaseLogger.info('Admin user created:', newAdminUser.username)
              resolveOne()
            }
          })
        } else {
          resolveOne()
        }
      })

      // Set a timeout to reject the promise.
      setTimeout(() => {
        if (awaitingResolve > 0) {
          databaseLogger.error(
            'Failed to create default users: Timed out while waiting for users to be created.',
          )
          reject(
            new Error(
              'Failed to create default users: Timed out while waiting for users to be created.',
            ),
          )
        }
      }, 30 * 1000)
    })
  }

  /**
   * This will ensure that the missions collection is populated with necessary default data.
   * @returns A promise that resolves once the default data is ensured to exist.
   */
  private async ensureDefaultMissionsExists(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      MissionModel.find({}).exec((error: Error, missions: any) => {
        if (error !== null) {
          databaseLogger.error('Failed to query database for default missions:')
          databaseLogger.error(error)
          reject(error)
        } else if (missions.length === 0) {
          databaseLogger.info('No missions were found.')
          databaseLogger.info('Creating default missions...')

          MissionModel.create(demoMissionData, (error: Error, mission: any) => {
            if (error) {
              databaseLogger.error(`Failed to create ${demoMissionData.name}.`)
              databaseLogger.error(error)
              reject(error)
            } else {
              databaseLogger.info(`${mission.name} has been created.`)
              resolve()
            }
          })
        } else {
          resolve()
        }
      })
    })
  }

  /**
   * This will check to make sure that the schema
   * build number specified in the config is the
   * same as the one stored in the database. If not,
   * the database will be updated until the build
   * number is the same.
   * @returns A promise that resolves once the schema build is correct.
   */
  private async ensureCorrectSchemaBuild(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      InfoModel.findOne().exec(async (error: Error, info: any) => {
        if (error !== null) {
          databaseLogger.error(
            'Failed to query database for current schema build:',
          )
          databaseLogger.error(error)
          reject(error)
        } else if (info !== null) {
          let currentBuildNumber: number = info.schemaBuildNumber

          let targetBuildNumber: number = MetisServer.SCHEMA_BUILD_NUMBER

          if (currentBuildNumber > targetBuildNumber) {
            databaseLogger.error('Failed to check for schema updates:')
            databaseLogger.error(
              'The current schema build number found in the database was newer than ' +
                'the target build number found in the config.',
            )
            reject(error)
          } else if (currentBuildNumber < targetBuildNumber) {
            await this.buildSchema(currentBuildNumber, targetBuildNumber)
            resolve()
          } else {
            resolve()
          }
        } else {
          databaseLogger.error(
            'Failed to check for schema updates. Info data missing.',
          )
          reject(
            new Error('Failed to check for schema updates. Info data missing.'),
          )
        }
      })
    })
  }

  /**
   * This will build the schema for the given schema build number.
   * @param currentBuildNumber The current schema build number.
   * @param targetBuildNumber The target schema build number.
   * @returns A promise that resolves once the schema is built to the target build number.
   */
  private async buildSchema(
    currentBuildNumber: number,
    targetBuildNumber: number,
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const { mongoUsername, mongoPassword, mongoDB, mongoHost, mongoPort } =
        this.server
      let nextBuildNumber: number = currentBuildNumber + 1
      let buildPath: string = MetisDatabase.generateFilePath(nextBuildNumber)
      let command: string = `mongosh --host ${mongoHost} --port ${mongoPort} --file ${buildPath}`

      if (mongoUsername && mongoPassword) {
        command += ` --username ${mongoUsername} --password ${mongoPassword} --authenticationDatabase ${mongoDB}`
      }

      process.env.MONGO_DB = mongoDB

      databaseLogger.info(`Database is migrating to build ${nextBuildNumber}`)
      console.log(`Database is migrating to build ${nextBuildNumber}`)

      exec(command, async (error, stdout, stderr) => {
        let stdoutSplit: Array<string> = stdout.split(
          `Loading file: ${buildPath}`,
        )

        if (stdoutSplit.length > 1) {
          stdout = stdoutSplit[1]
        }

        databaseLogger.info(stdout)
        console.log(stdout)

        if (!error) {
          databaseLogger.info(
            `Database successfully migrated to build ${nextBuildNumber}`,
          )
          console.log(
            `Database successfully migrated to build ${nextBuildNumber}`,
          )

          if (nextBuildNumber < targetBuildNumber) {
            await this.buildSchema(nextBuildNumber, targetBuildNumber)
            resolve()
          } else {
            resolve()
          }
        } else {
          databaseLogger.error(
            `Database failed to migrate to ${nextBuildNumber}`,
          )
          databaseLogger.error(error)
          console.log(`Database failed to migrate to ${nextBuildNumber}`)
          reject(error)
        }
      })
    })
  }

  /**
   * Identifier for an error thrown due to bad data.
   */
  public static readonly ERROR_BAD_DATA: string = 'BadDataError'

  /**
   * Location of the database build files.
   */
  public static readonly BUILD_DIR: string = './database/builds/'

  /**
   * This will generate the file path for the given build number.
   * @param buildNumber The build number.
   * @returns The file path for the given build number.
   */
  private static generateFilePath(buildNumber: number) {
    let buildNumberAsStr: string = `${buildNumber}`

    while (buildNumberAsStr.length < 6) {
      buildNumberAsStr = '0' + buildNumberAsStr
    }

    return `${MetisDatabase.BUILD_DIR}build_${buildNumberAsStr}.js`
  }
}
