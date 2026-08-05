import { targetArgumentJsonSchema } from '@shared/target-environments/arguments/TargetArgument'
import { VersionToolbox } from '@shared/toolbox/strings/VersionToolbox'
import zod from 'zod'
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
   * A shallow copy of the migrations available for a target. Key order
   * is maintained in ascending version order by {@link refreshMigrationOrder}.
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
   * @throws If the migrated arguments do not match the target
   * argument schema.
   * @note Result from the migration will be accessible via
   * the `result` property after migrations are realized.
   */
  public migrate(effect: TMigratableEffect): void {
    let migrations = this.getPending(effect)
    let startingVersion = effect.versionCursor
    let appliedVersions: string[] = []

    for (let migration of migrations) {
      migration.script(effect)
      effect.versionCursor = migration.version
      appliedVersions.push(migration.version)
    }

    let validation = zod
      .array(targetArgumentJsonSchema)
      .safeParse(effect.arguments)

    if (!validation.success) {
      throw new Error(
        this.describeValidationFailure(
          effect,
          startingVersion,
          appliedVersions,
          validation.error,
        ),
      )
    }
  }

  /**
   * @param effect The effect for which to determine pending migrations.
   * @returns All migrations which must be run in order to bring the
   * effect past its current version cursor.
   */
  private getPending(effect: TMigratableEffect): TargetMigration[] {
    return Array.from(Object.values(this._migrations)).filter(({ version }) =>
      VersionToolbox.isLaterThan(version, effect.versionCursor),
    )
  }

  /**
   * @param effect The effect whose migrated arguments failed validation.
   * @param startingVersion The version cursor before any migration ran.
   * @param appliedVersions The versions applied, in the order they ran.
   * @param error The failure reported by the target argument schema.
   * @returns A message naming the effect, the versions applied, and the
   * offending arguments by parameter ID.
   */
  private describeValidationFailure(
    effect: TMigratableEffect,
    startingVersion: string,
    appliedVersions: string[],
    error: zod.ZodError,
  ): string {
    // Each issue path begins with the argument's index in the array
    // that was validated, which is used to name the parameter it holds.
    let details = error.issues.map((issue) => {
      let [index, ...remainingPath] = issue.path
      let argument =
        typeof index === 'number' ? effect.arguments[index] : undefined
      let location = argument
        ? `argument "${argument.parameterId}"`
        : `argument at index ${String(index)}`
      let field = remainingPath.length ? ` (${remainingPath.join('.')})` : ''
      return `${location}${field}: ${issue.message}`
    })

    let chain = appliedVersions.length
      ? [startingVersion, ...appliedVersions].join(' -> ')
      : `${startingVersion} (no migrations applied)`

    return (
      `Migration failed. The migrated arguments for effect "${effect.name}" ` +
      `(${effect._id}) do not match the target argument schema. ` +
      `Versions applied: ${chain}. Offending arguments: ${details.join('; ')}.`
    )
  }
}
