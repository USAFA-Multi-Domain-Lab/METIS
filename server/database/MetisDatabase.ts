import { MetisServer } from '@server/MetisServer'
import { MissionImport } from '@server/missions/imports/MissionImport'
import { DateToolbox } from '@shared/toolbox/dates/DateToolbox'
import type { TUserJson } from '@shared/users/User'
import { User } from '@shared/users/User'
import { execFile } from 'child_process'
import type { ConnectOptions } from 'mongoose'
import mongoose from 'mongoose'
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
   * The path of the most recent backup taken by {@link createBackup}, or `null`
   * if no backup has been taken this run. Recorded against an in-progress
   * migration so an interrupted run can point the operator at the exact backup.
   */
  private backupPath: string | null

  /**
   * @param server The Metis server instance.
   */
  public constructor(server: MetisServer) {
    this._mongooseConnection = null
    this._server = server
    this.backupIntervalId = null
    this.backupPath = null
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
          // Refuse to start if a previous migration was left incomplete. This
          // runs before the backup so a halted startup does not snapshot a
          // half-migrated database.
          await this.ensureNoIncompleteMigration()
          if (server.backupsEnabled) {
            // Create backup of database before use.
            await this.createBackup()
          } else {
            databaseLogger.info(
              'Database backups disabled via the DB_BACKUPS_ENABLED environment variable.',
            )
          }
          // Ensure the info-collection exists.
          await this.ensureDefaultInfoExists()
          // Ensure that the schema build is correct.
          await this.ensureCorrectSchemaBuild()
          // Ensure default users and missions are
          // populated.
          await this.ensureDefaultUsersExists()
          await this.ensureDefaultMissionsExists()

          if (server.backupsEnabled) {
            try {
              // Schedule a backup every 24 hours
              // while server is running.
              this.backupIntervalId = setInterval(
                () => this.createBackup(),
                1000 * 60 * 60 * 24,
              )
            } catch (error) {
              databaseLogger.error(
                'Failed to perform scheduled database backup:',
              )
              databaseLogger.error(error)
            }
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

      this.backupPath = `server/database/backups/${DateToolbox.fileName}`

      const args: string[] = []

      args.push('--host', mongoHost)
      args.push('--port', String(mongoPort))
      args.push('--db', mongoDB)
      args.push('--out', this.backupPath)

      if (mongoUsername !== undefined && mongoPassword !== undefined) {
        args.push('--username', mongoUsername)
        args.push('--password', mongoPassword)
        args.push('--authenticationDatabase', mongoDB)
      }

      execFile('mongodump', args, (error, stdout, stderr) => {
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
            this.server,
            {
              username: User.SYSTEM_USERNAME,
              _id: User.SYSTEM_ID,
            },
          )
          await missionImport.execute()

          // Check if the default mission was created.
          if (missionImport.results.successfulImportCount === 0) {
            throw new Error(`Failed to create default mission(s).`)
          }

          missionDocs = await MissionModel.find().exec()

          if (missionDocs.length === 0) {
            throw new Error(
              'Failed to find the default mission(s) in the database after import.',
            )
          }

          for (let missionDoc of missionDocs) {
            databaseLogger.info(
              `Default mission created: { _id: ${missionDoc._id}, name: ${missionDoc.name} }`,
            )
          }
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
   * @resolves Once the schema is built up to the target build number.
   * @rejects If a build fails, if its in-progress flag cannot be recorded, or
   * if a later build in the sequence fails.
   */
  private async buildSchema(
    currentBuildNumber: number,
    targetBuildNumber: number,
  ): Promise<void> {
    let nextBuildNumber: number = currentBuildNumber + 1

    // Record that a migration to this build is underway before it runs, so an
    // interrupted run can be detected on the next startup.
    await this.markMigrationInProgress(nextBuildNumber)

    return new Promise<void>((resolve, reject) => {
      const { mongoUsername, mongoPassword, mongoDB, mongoHost, mongoPort } =
        this.server
      let buildPath: string = MetisDatabase.generateFilePath(nextBuildNumber)
      let buildPathAbsolute = MetisServer.resolvePath('..', buildPath)
      let args: string[] = [
        '--host',
        mongoHost,
        '--port',
        String(mongoPort),
        '--file',
        buildPathAbsolute,
      ]

      if (mongoUsername && mongoPassword) {
        args.push(
          '--username',
          mongoUsername,
          '--password',
          mongoPassword,
          '--authenticationDatabase',
          mongoDB,
        )
      }

      databaseLogger.info(`Database is migrating to build ${nextBuildNumber}`)
      console.log(`Database is migrating to build ${nextBuildNumber}`)

      execFile(
        'mongosh',
        args,
        { env: { ...process.env, MONGO_DB: mongoDB } },
        async (error, stdout, stderr) => {
          let stdoutSplit: Array<string> = stdout.split(
            `Loading file: ${buildPathAbsolute}`,
          )

          if (stdoutSplit.length > 1) {
            stdout = stdoutSplit[1]
          }

          databaseLogger.info(stdout)
          console.log(stdout)

          if (!error) {
            // A throw anywhere in this branch — clearing the flag or a later
            // build in the sequence — must reject so the outer promise settles
            // and startup shuts down cleanly rather than hanging.
            try {
              // Clear the in-progress flag now that this build has completed.
              await this.clearMigrationInProgress()

              databaseLogger.info(
                `Database successfully migrated to build ${nextBuildNumber}`,
              )
              console.log(
                `Database successfully migrated to build ${nextBuildNumber}`,
              )

              if (nextBuildNumber < targetBuildNumber) {
                await this.buildSchema(nextBuildNumber, targetBuildNumber)
              }

              resolve()
            } catch (buildError) {
              reject(buildError)
            }
          } else {
            databaseLogger.error(
              `Database failed to migrate to ${nextBuildNumber}`,
            )
            databaseLogger.error(error)
            if (stderr) {
              databaseLogger.error(stderr)
            }

            // The in-progress flag is left set so a restart without restoring is
            // also halted. Surface restore instructions to the operator.
            this.logIncompleteMigration(nextBuildNumber, this.backupPath)

            reject(error)
          }
        },
      )
    })
  }

  /**
   * Records that a migration to the given build number is underway, along with
   * the backup taken before it began. Written before a build runs so an
   * interrupted run can be detected on the next startup and the operator
   * pointed at the exact backup.
   * @param buildNumber The build number the migration is advancing to.
   * @resolves Once the flag is recorded.
   * @rejects If the flag cannot be written to the database.
   */
  private async markMigrationInProgress(buildNumber: number): Promise<void> {
    await InfoModel.updateOne(
      {},
      {
        $set: {
          migrationInProgress: buildNumber,
          migrationBackupPath: this.backupPath,
        },
      },
    ).exec()
  }

  /**
   * Clears the migration-in-progress flag once a build has completed, or when a
   * stale flag from an already-finished migration is found on startup.
   * @resolves Once the flag is cleared.
   * @rejects If the flag cannot be cleared in the database.
   */
  private async clearMigrationInProgress(): Promise<void> {
    await InfoModel.updateOne(
      {},
      { $set: { migrationInProgress: null, migrationBackupPath: null } },
    ).exec()
  }

  /**
   * Halts startup if a previous schema migration was interrupted before it
   * completed. Reads the {@link InfoModel} migration flag: if a migration to a
   * build number the database never reached is still recorded, the data may be
   * partially converted, so the operator is given restore instructions and an
   * error is thrown to stop startup. A flag whose build number has already been
   * reached is treated as stale (the clearing write was lost) and cleared.
   * @resolves When it is safe to continue startup: no migration is flagged, or
   * a stale flag was cleared.
   * @rejects If a previous migration was left incomplete, halting startup, or
   * if the info document cannot be read or updated.
   */
  private async ensureNoIncompleteMigration(): Promise<void> {
    let info = await InfoModel.findOne().exec()

    // A fresh database has no info document yet, so nothing can be pending.
    if (!info) {
      return
    }

    let { migrationInProgress, schemaBuildNumber } = info

    // No migration is flagged: the database is at a clean build boundary.
    if (migrationInProgress === null || migrationInProgress === undefined) {
      return
    }

    // The flagged build was actually reached, so the migration completed and
    // only the clearing write was lost (e.g. the process was killed in the gap
    // after the build stamped its number). Clear the stale flag and continue.
    if (schemaBuildNumber >= migrationInProgress) {
      await this.clearMigrationInProgress()
      databaseLogger.info(
        `Cleared a stale migration-in-progress flag for build ${migrationInProgress}; that migration had already completed.`,
      )
      return
    }

    // Otherwise a migration to migrationInProgress began but never finished.
    // The database may be half-converted, so refuse to start and recommend a
    // restore.
    this.logIncompleteMigration(migrationInProgress, info.migrationBackupPath)

    throw new Error(
      `Startup halted: a previous migration to schema build ${migrationInProgress} did not complete. Restore the database from a pre-migration backup and restart.`,
    )
  }

  /**
   * Logs the operator-facing message shown when a migration is found to be
   * incomplete, including a ready-to-run restore command when the pre-migration
   * backup path is known. Written to both the database log and the console so it
   * is surfaced wherever the operator is watching.
   * @param buildNumber The build the interrupted migration was targeting.
   * @param backupPath The pre-migration backup path, or `null` if none exists.
   */
  private logIncompleteMigration(
    buildNumber: number,
    backupPath: string | null,
  ): void {
    let { mongoHost, mongoPort, mongoDB, mongoUsername, mongoPassword } =
      this.server
    let lines: string[] = []

    lines.push('')
    lines.push('=============== DATABASE MIGRATION INCOMPLETE ===============')
    lines.push(
      `A previous migration to schema build ${buildNumber} did not finish, so`,
    )
    lines.push(
      'the database may be partially converted. The server will not start',
    )
    lines.push('until it is restored to its pre-migration state.')
    lines.push('')

    if (backupPath) {
      let restoreArgs: string[] = [
        'mongorestore',
        '--drop',
        `--host ${mongoHost}`,
        `--port ${mongoPort}`,
        `--db ${mongoDB}`,
      ]

      if (mongoUsername && mongoPassword) {
        restoreArgs.push(
          `--username ${mongoUsername}`,
          '--password <password>',
          `--authenticationDatabase ${mongoDB}`,
        )
      }

      restoreArgs.push(`${backupPath}/${mongoDB}`)

      lines.push('A backup was taken immediately before the migration began:')
      lines.push(`  ${backupPath}`)
      lines.push('')
      lines.push('To restore it, run:')
      lines.push(`  ${restoreArgs.join(' ')}`)
    } else {
      lines.push(
        'No automatic backup is available (database backups are disabled).',
      )
      lines.push(
        'Restore the database from your own most recent pre-migration backup.',
      )
    }

    lines.push('')
    lines.push(
      'After restoring, restart the server and the migration will run again',
    )
    lines.push('from a clean state.')
    lines.push('============================================================')
    lines.push('')

    let message = lines.join('\n')
    databaseLogger.error(message)
    console.error(message)
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
