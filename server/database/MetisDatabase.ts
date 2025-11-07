import { MissionImport } from '@server/missions/imports/MissionImport'
import { DateToolbox } from '@shared/toolbox/dates/DateToolbox'
import type { TUserJson } from '@shared/users/User'
import { User } from '@shared/users/User'
import { exec } from 'child_process'
import type { ConnectOptions } from 'mongoose'
import mongoose from 'mongoose'
import { MetisServer } from '..'
import { databaseLogger } from '../logging'
import { InfoModel } from './models/info'
import { MissionModel } from './models/missions'
import { UserModel, hashPassword } from './models/users'
import { ERROR_BAD_DATA, generateValidationError } from './validation'

/**
 * Represents a connection to the Metis database.
 */
export class MetisDatabase {
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
   * The interval ID for scheduled backups.
   * Can be used to clear it with {@link clearInterval}.
   */
  private backupIntervalId: NodeJS.Timeout | null

  /**
   * @param server The Metis server instance.
   */
  public constructor(server: MetisServer) {
    this._mongooseConnection = null
    this._server = server
    this.backupIntervalId = null
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
          // Ensure the info-collection exists.
          await this.ensureDefaultInfoExists()
          // Ensure that the schema build is correct.
          await this.ensureCorrectSchemaBuild()
          // Ensure default users and missions are
          // populated.
          await this.ensureDefaultUsersExists()
          await this.ensureDefaultMissionsExists()

          try {
            // Schedule a backup every 24 hours
            // while server is running.
            this.backupIntervalId = setInterval(
              () => this.createBackup(),
              1000 * 60 * 60 * 24,
            )
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

      let command: string = `mongodump --host ${mongoHost} --port ${mongoPort} --db ${mongoDB} --out server/database/backups/${DateToolbox.fileName}`

      if (mongoUsername !== undefined && mongoPassword !== undefined) {
        command += ` --username ${mongoUsername} --password ${mongoPassword} --authenticationDatabase ${mongoDB}`
      }

      exec(command, (error, stdout, stderr) => {
        if (!error) {
          let stdoutSplit: Array<string> = stdout.split(
            `Loading file: server/database/backup.js`,
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
   * This will ensure that the info collection is populated with necessary default data.
   * @returns A promise that resolves once the default data is ensured to exist.
   */
  private async ensureDefaultInfoExists(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        // Query for the info.
        let info = await InfoModel.findOne().exec()
        // If no info is found, create the default info.
        if (info === null) {
          databaseLogger.info('Info not found.')
          databaseLogger.info('Creating info...')

          // Create the default info.
          let newInfo = await InfoModel.create({
            schemaBuildNumber: MetisServer.SCHEMA_BUILD_NUMBER,
          })
          databaseLogger.info(`Server info created: { _id: ${newInfo.id} }`)
        }

        resolve()
      } catch (error: any) {
        databaseLogger.error(
          'Failed to ensure default info exists in the database.\n',
          error,
        )
        reject(error)
      }
    })
  }

  /**
   * Ensures that a default user with the provided
   * data exists in the database, creating it if not.
   * @param userId The fixed ID of the default user.
   * @param seedingData The data to use to seed the
   * default user, if it is not found.
   * @resolves Once the default user is found or once
   * it is created, if not found.
   * @rejects If an error occurs while checking for
   * or creating the default user.
   */
  private async ensureDefaultUserExists(
    userId: string,
    seedingData: TUserJson,
  ): Promise<void> {
    try {
      // Query for the user.
      let user = await UserModel.findById(userId).exec()

      // If no user is found, create the default admin user.
      if (user === null) {
        databaseLogger.info('Default user not found: ', userId)
        databaseLogger.info(
          'Creating default user with username: ',
          seedingData.username,
        )

        // Hash admin user password.
        if (seedingData.password) {
          seedingData.password = await hashPassword(seedingData.password)
        }

        // Create admin user.
        let newAdminUser = await UserModel.create(seedingData)

        databaseLogger.info('Default user created:', newAdminUser.username)
      }
    } catch (error: any) {
      databaseLogger.error(
        'Failed to ensure default user exists in the database.\n',
        error,
      )
      throw error
    }
  }

  /**
   * This will ensure that the users collection is populated with necessary default data.
   * @returns A promise that resolves once the default data is ensured to exist.
   */
  private async ensureDefaultUsersExists(): Promise<void> {
    // Create an array of promises to handle
    // when all default-user verification is
    // resolved.
    const promises: Array<Promise<void>> = [
      // Ensure the system user and admin users
      // exist.
      this.ensureDefaultUserExists(User.SYSTEM_ID, User.SYSTEM_SEEDING_DATA),
      this.ensureDefaultUserExists(User.ADMIN_ID, User.ADMIN_SEEDING_DATA),
    ]
    // Await the completion of all operations.
    await Promise.all(promises)
  }

  /**
   * This will ensure that the missions collection is populated with necessary default data.
   * @returns A promise that resolves once the default data is ensured to exist.
   */
  private async ensureDefaultMissionsExists(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        // Query for all missions.
        let missionDocs = await MissionModel.find().exec()
        // If no missions are found, create the default mission(s).
        if (missionDocs.length === 0) {
          databaseLogger.info('No missions were found.')
          databaseLogger.info('Creating default mission(s)...')

          // Create the default mission(s).
          let missionImport = new MissionImport(
            {
              name: 'default.metis',
              originalName: 'default.metis',
              path: 'server/database/seeding/default.metis',
            },
            this.server.fileStore,
          )
          await missionImport.execute()

          // Check if the default mission was created.
          if (missionImport.results.successfulImportCount === 0) {
            throw new Error(`Failed to create default mission(s).`)
          }

          let missionDoc = await MissionModel.findOne({
            name: 'METIS > ASCOT 7 DEMO',
          }).exec()

          if (!missionDoc) {
            throw new Error(
              `Failed to find the default mission in the database.`,
            )
          }

          databaseLogger.info(
            `Default mission created: { _id: ${missionDoc._id}, name: ${missionDoc.name} }`,
          )
        }

        resolve()
      } catch (error: any) {
        databaseLogger.error(
          'Failed to ensure default missions exist in the database.\n',
          error,
        )
        reject(error)
      }
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
    return new Promise<void>(async (resolve, reject) => {
      try {
        // Query for the info.
        let info = await InfoModel.findOne().exec()
        // If no info is found, reject.
        if (!info) {
          throw new Error('The info document was not found in the database.')
        }
        // Grab the current build number.
        let currentBuildNumber: number = info.schemaBuildNumber
        // Grab the target build number.
        let targetBuildNumber: number = MetisServer.SCHEMA_BUILD_NUMBER

        // If the current build number is newer than the target build number...
        if (currentBuildNumber > targetBuildNumber) {
          // Throw an error.
          throw new Error(
            'The current schema build number found in the database was newer than the target build number found in the config.',
          )
        }
        // Or, if the current build number is older than the target build number...
        else if (currentBuildNumber < targetBuildNumber) {
          // Update the schema to the most recent build.
          await this.buildSchema(currentBuildNumber, targetBuildNumber)
        }

        // Otherwise, resolve.
        resolve()
      } catch (error: any) {
        databaseLogger.error(
          'Failed to ensure that the schema build number in the database is correct.\n',
          error,
        )
        reject(error)
      }
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
   * Closes out database connection and stops any
   * DB-related daemons.
   */
  public async close(): Promise<void> {
    if (this.backupIntervalId) {
      clearInterval(this.backupIntervalId)
      this.backupIntervalId = null
    }
    await this.mongooseConnection?.close()
  }

  /**
   * Identifier for an error thrown due to bad data.
   */
  public static readonly ERROR_BAD_DATA: string = ERROR_BAD_DATA

  /**
   * Location of the database build files.
   */
  public static readonly BUILD_DIR: string = 'server/database/builds/'

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

  /**
   * This will generate a validation error for the given message.
   * @param message The error message.
   * @returns The validation error.
   */
  public static generateValidationError(message: string): Error {
    return generateValidationError(message)
  }
}
