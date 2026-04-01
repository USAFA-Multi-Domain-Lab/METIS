import type { TEffectMigrationResult } from '@shared/missions/effects/Effect'
import { Effect } from '@shared/missions/effects/Effect'
import type { TAnyObject } from '@shared/toolbox/objects/ObjectToolbox'
import { VersionToolbox } from '@shared/toolbox/strings/VersionToolbox'
import type { TTargetEnvExposedEffect } from './context/TargetEnvContext'

/**
 * A migration which will update an effect to be
 * compatible with the given version of the target
 * environment.
 */
export class TargetMigration {
  public constructor(
    /**
     * The version of target environment with which
     * the effect will be compatible after the migration
     * takes place.
     */
    public readonly version: string,
    /**
     * The script used to migrate the effect args. Any mutations
     * made to {@link TMigratableEffect['args']}
     * will be used to overwrite existing effect data.
     * @param effect The effect to migrate.
     */
    public readonly script: TTargetMigrationScript,
  ) {
    if (!VersionToolbox.isValidVersion(version)) {
      throw new Error(
        `Invalid version "${version}" provided for target migration.`,
      )
    }
  }
}

/* -- TYPES -- */

/**
 * The script used by a {@link TargetMigration} in order
 * to perform the migration.
 */
export type TTargetMigrationScript = (effect: TMigratableEffect) => void

/**
 * An effect representation that can be used by
 * a {@link TargetMigration} in order to migrate
 * the data to a new version of METIS. Links to
 * relational data such as the corresponding mission
 * and target are also included here to dynamically
 * modify the data based on the current mission state.
 */
export interface TMigratableEffect extends TTargetEnvExposedEffect {
  /**
   * Data that can be migrated by a {@link TargetMigration}.
   */
  args: TAnyObject
  /**
   * Tracks the current version for the effect data. This will allow
   * the migration system to perform multiple migrations in a row and
   * track which version was last applied.
   * @note Initially this will be set to the value of {@link Effect.targetEnvironmentVersion}.
   */
  versionCursor: string
  /**
   * The resulting data produced from the migration.
   */
  get result(): TEffectMigrationResult
}
