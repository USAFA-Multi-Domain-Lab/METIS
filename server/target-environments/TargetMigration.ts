import type { TAnyObject } from '@shared/toolbox/objects/ObjectToolbox'
import { VersionToolbox } from '@shared/toolbox/strings/VersionToolbox'
import type { TTargetEnvExposedMission } from './context/TargetEnvContext'

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
     * The script used to migrate the effect args
     * to the given version by mutating them in place.
     * @param effectArgs The effect arguments to migrate via mutation.
     */
    public readonly script: (
      effectArgs: TAnyObject,
      mission: TTargetEnvExposedMission,
    ) => void,
  ) {
    if (!VersionToolbox.isValidVersion(version)) {
      throw new Error(
        `Invalid version "${version}" provided for target migration.`,
      )
    }
  }
}
