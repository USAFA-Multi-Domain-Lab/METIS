import { AnyObject } from 'metis/toolbox/objects'
import TargetMigration from '.'

/**
 * A registry of target migrations.
 */
export default class TargetMigrationRegistry {
  /**
   * The migrations available for a target.
   */
  protected readonly migrations: Record<string, TargetMigration>

  /**
   * All registered versions with available migration
   * scripts.
   */
  public get versions(): string[] {
    return Object.keys(this.migrations)
  }

  public constructor() {
    this.migrations = {}
  }

  /**
   * Adds a migration to the list.
   * @param version The version of the migration.
   * @param script The script used to migrate the
   * effect args to the given version.
   * @return Itself for chaining.
   */
  public register(
    version: string,
    script: (effectArgs: Record<any, any>) => Record<any, any>,
  ): TargetMigrationRegistry {
    this.migrations[version] = new TargetMigration(version, script)
    return this
  }

  /**
   * Migrates the given effect arguments to the
   * given version.
   * @param version The version to which the effect
   * arguments should be migrated.
   * @param effectArgs The effect arguments to migrate.
   * @returns The migrated effect arguments.
   */
  public migrate(version: string, effectArgs: Record<any, any>): AnyObject {
    const migration = this.migrations[version]

    // If no migration is found for the given version,
    // return the effect arguments as is.
    if (!migration) {
      console.warn(`No migration found for version "${version}".`)
      return effectArgs
    }

    return migration.script(effectArgs)
  }
}
