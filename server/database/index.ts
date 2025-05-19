import { exec } from 'child_process'
import MetisServer from 'metis/server'
import InfoModel from 'metis/server/database/models/info'
import MissionModel from 'metis/server/database/models/missions'
import UserModel, { hashPassword } from 'metis/server/database/models/users'
import { databaseLogger } from 'metis/server/logging'
import MissionImport from 'metis/server/missions/imports'
import { DateToolbox } from 'metis/toolbox/dates'
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
          // Ensure that the default data exists.
          await this.ensureDefaultDataExists()
          // Ensure that the schema build is correct.
          await this.ensureCorrectSchemaBuild()

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
      const nowFormatted: string = DateToolbox.format(
        now,
        'isoDateTime',
      ).replaceAll(':', '-')
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
   * This will ensure that the users collection is populated with necessary default data.
   * @returns A promise that resolves once the default data is ensured to exist.
   */
  private async ensureDefaultUsersExists(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      // Check if a student user exists.
      const verifyStudent = new Promise<void>(async (resolve, reject) => {
        try {
          let studentUser = await UserModel.findOne({
            accessId: studentUserData.accessId,
          }).exec()

          // If no student user is found, create the default student user.
          if (studentUser === null) {
            databaseLogger.info('Student user not found.')
            databaseLogger.info('Creating student user...')

            // Hash student user password.
            if (studentUserData.password) {
              studentUserData.password = await hashPassword(
                studentUserData.password,
              )
            }

            // Create student user.
            let newStudentUser = await UserModel.create(studentUserData)
            databaseLogger.info(
              'Student user created:',
              newStudentUser.username,
            )
          }

          // Resolve.
          resolve()
        } catch (error: any) {
          databaseLogger.error(
            'Failed to ensure a student user exists in the database.\n',
            error,
          )
          reject(error)
        }
      })

      // Check if an instructor user exists.
      const verifyInstructor = new Promise<void>(async (resolve, reject) => {
        try {
          let instructorUser = await UserModel.findOne({
            accessId: instructorUserData.accessId,
          }).exec()

          // If no instructor user is found, create the default instructor user.
          if (instructorUser === null) {
            databaseLogger.info('Instructor user not found.')
            databaseLogger.info('Creating instructor user...')

            // Hash instructor user password.
            if (instructorUserData.password) {
              instructorUserData.password = await hashPassword(
                instructorUserData.password,
              )
            }

            // Create instructor user.
            let newInstructorUser = await UserModel.create(instructorUserData)
            databaseLogger.info(
              'Instructor user created:',
              newInstructorUser.username,
            )
          }

          // Resolve.
          resolve()
        } catch (error: any) {
          databaseLogger.error(
            'Failed to ensure an instructor user exists in the database.\n',
            error,
          )
          reject(error)
        }
      })

      // Check if an admin user exists.
      const verifyAdmin = new Promise<void>(async (resolve, reject) => {
        try {
          let adminUser = await UserModel.findOne({
            accessId: adminUserData.accessId,
          }).exec()

          // If no admin user is found, create the default admin user.
          if (adminUser === null) {
            databaseLogger.info('Admin user not found.')
            databaseLogger.info('Creating admin user...')

            // Hash admin user password.
            if (adminUserData.password) {
              adminUserData.password = await hashPassword(
                adminUserData.password,
              )
            }

            // Create admin user.
            let newAdminUser = await UserModel.create(adminUserData)
            databaseLogger.info('Admin user created:', newAdminUser.username)
          }

          // Resolve.
          resolve()
        } catch (error: any) {
          databaseLogger.error(
            'Failed to ensure an admin user exists in the database.\n',
            error,
          )
          reject(error)
        }
      })

      // Create an array of promises.
      const promises: Array<Promise<void>> = [
        verifyStudent,
        verifyInstructor,
        verifyAdmin,
      ]

      // Wait for all promises to resolve.
      try {
        await Promise.all(promises)
        resolve()
      } catch (error: any) {
        databaseLogger.error(
          'Failed to ensure default users exist in the database.\n',
          error,
        )
        reject(error)
      }
    })
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
              path: './database/seeding/default.metis',
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

  /**
   * This will generate a validation error for the given message.
   * @param message The error message.
   * @returns The validation error.
   */
  public static generateValidationError(message: string): Error {
    let error = new Error(message)
    error.name = this.ERROR_BAD_DATA
    return error
  }
}
