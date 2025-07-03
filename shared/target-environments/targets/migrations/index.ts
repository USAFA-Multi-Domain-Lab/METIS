import { AnyObject } from 'metis/toolbox/objects'
import VersionToolbox from 'metis/toolbox/versions'

/**
 * A migration which will update an effect to be
 * compatible with the given version of the target
 * environment.
 */
export default class TargetMigration {
  public constructor(
    /**
     * The version of target environment with which
     * the effect will be compatible after the migration
     * takes place.
     */
    public readonly version: string,
    /**
     * The script used to migrate the effect args
     * to the given version.
     * @param effectArgs The non-migrated effect arguments.
     * @returns The migrated effect arguments.
     */
    public readonly script: (effectArgs: AnyObject) => AnyObject,
  ) {
    if (!VersionToolbox.isValidVersion(version)) {
      throw new Error(
        `Invalid version "${version}" provided for target migration.`,
      )
    }
  }
}
