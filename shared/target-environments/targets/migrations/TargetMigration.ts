import type { TAnyObject } from '../../../toolbox/objects/ObjectToolbox'
import { VersionToolbox } from '../../../toolbox/strings/VersionToolbox'

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
    public readonly script: (effectArgs: TAnyObject) => void,
  ) {
    if (!VersionToolbox.isValidVersion(version)) {
      throw new Error(
        `Invalid version "${version}" provided for target migration.`,
      )
    }
  }
}
