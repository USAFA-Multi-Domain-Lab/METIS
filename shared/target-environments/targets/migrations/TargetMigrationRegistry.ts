import { TargetMigration } from './TargetMigration'

/**
 * A registry of target migrations.
 */
export class TargetMigrationRegistry {
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
    script: (effectArgs: Record<any, any>) => void,
  ): TargetMigrationRegistry {
    this.migrations[version] = new TargetMigration(version, script)
    return this
  }

  /**
   * Migrates the given effect arguments to the given version
   * by mutating them in place.
   * @param version The version to which the effect
   * arguments should be migrated.
   * @param effectArgs The effect arguments to migrate via mutation.
   */
  public migrate(version: string, effectArgs: Record<any, any>): void {
    const migration: TargetMigration | undefined = this.migrations[version]

    if (migration) {
      migration.script(effectArgs)
    } else {
      console.warn(`No migration found for version "${version}".`)
    }
  }
}
