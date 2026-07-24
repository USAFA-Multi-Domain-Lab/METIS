import type { Document, Model } from 'mongoose'

/**
 * Represents an info object in the database.
 */
export type TInfo = {
  /**
   * The current build number that the schema is at.
   */
  schemaBuildNumber: number
  /**
   * The build number of a schema migration that is currently running, or
   * `null` when no migration is in progress. It is set immediately before a
   * build script runs and cleared once that build succeeds. If the server
   * starts and finds this set to a number greater than {@link schemaBuildNumber},
   * a previous migration was interrupted and the database may be partially
   * converted; the server refuses to run further migrations and recommends
   * restoring the pre-migration backup.
   */
  migrationInProgress: number | null
  /**
   * The filesystem path of the backup taken immediately before the in-progress
   * migration began, or `null` when no migration is in progress. It is surfaced
   * in the operator message so a manual restore can target the exact backup.
   */
  migrationBackupPath: string | null
}

/**
 * Represents the methods available for a `InfoModel`.
 */
export type TInfoMethods = {}

/**
 * Represents the static methods available for a `InfoModel`.
 */
export type TInfoStaticMethods = {}

/**
 * Represents a mongoose model for an info object in the database.
 */
export type TInfoModel = Model<TInfo, {}, TInfoMethods> & TInfoStaticMethods

/**
 * Represents a mongoose document for an info object in the database.
 */
export type TInfoDoc = Document<any, any, TInfo>
