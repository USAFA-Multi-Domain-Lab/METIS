import { VersionToolbox } from '@shared/toolbox/strings/VersionToolbox'
import type {
  TMigratableEffect,
  TTargetMigrationScript,
} from './TargetMigration'
import { TargetMigration } from './TargetMigration'

/**
 * A registry of target migrations.
 */
export class TargetMigrationRegistry {
  /**
   * Actual memory store for the migration registry data.
   * @see {@link migrations} below.
   */
  protected readonly _migrations: Record<string, TargetMigration>
  /**
   * The migrations available for a target, sorted in ascending version order.
   */
  protected get migrations(): Record<string, TargetMigration> {
    return { ...this._migrations }
  }

  /**
   * All registered versions with available migration
   * scripts.
   */
  public get versions(): string[] {
    return Object.keys(this.migrations)
  }

  public constructor() {
    this._migrations = {}
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
    script: TTargetMigrationScript,
  ): TargetMigrationRegistry {
    this._migrations[version] = new TargetMigration(version, script)
    this.refreshMigrationOrder()
    return this
  }

  /**
   * Called when changes are made to {@link _migrations} to ensure
   * that the migrations are sorted in ascending version order.
   */
  private refreshMigrationOrder(): void {
    const sorted = VersionToolbox.sortVersions(Object.keys(this._migrations))
    for (const version of sorted) {
      const migration = this._migrations[version]
      delete this._migrations[version]
      this._migrations[version] = migration
    }
  }

  /**
   * Migrates the given effect to be compatible with the
   * current target-environment version.
   * @param effect The effect to migrate.
   * @note Result from the migration will be accessible via
   * the `result` property after migrations are realized.
   */
  public migrate(effect: TMigratableEffect): void {
    let migrations = this.getPending(effect)

    for (let migration of migrations) {
      migration.script(effect)
      effect.versionCursor = migration.version
    }
  }

  /**
   * @param effect The effect for which to determine pending migrations.
   * @param desiredVersion The desired target environment version
   * for the effect, once migrations are done.
   * @returns All migrations which must be run in order to make the
   * effect compatible with the desired version.
   */
  private getPending(effect: TMigratableEffect): TargetMigration[] {
    return Array.from(Object.values(this._migrations)).filter(({ version }) =>
      VersionToolbox.isLaterThan(version, effect.versionCursor),
    )
  }
}
