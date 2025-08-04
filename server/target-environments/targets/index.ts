import TargetSchema from 'integration/library/target-env-classes/targets'
import Arg, { TTargetArg } from 'metis/target-environments/args'
import Target, { TTargetScript } from 'metis/target-environments/targets'
import { AnyObject } from 'metis/toolbox/objects'
import VersionToolbox from 'metis/toolbox/versions'
import ServerTargetEnvironment from '..'
import TargetMigrationRegistry from '../../../shared/target-environments/targets/migrations/registry'
import { TMetisServerComponents } from '../../index'

/**
 * A class for managing targets on the server.
 */
export default class ServerTarget extends Target<TMetisServerComponents> {
  // Implemented
  public get migrationVersions(): string[] {
    return this.migrationRegistry.versions
  }

  protected constructor(
    _id: string,
    name: string,
    description: string,
    args: TTargetArg[] = [],
    environment: ServerTargetEnvironment,
    /**
     * The function used to execute an effect on the target.
     */
    public script: TTargetScript,

    /**
     * A registry of target-environment versions which have
     * a migration script for the target.
     */
    public migrationRegistry: TargetMigrationRegistry,
  ) {
    super(_id, name, description, args, environment)
  }

  /**
   * @param effectEnvVersion The current target environment version
   * for the effect.
   * @returns All versions for migrations which must be
   * run in order to make the effect compatible with the
   * latest migratable version of the target.
   */
  public getPendingMigrationVersions(effectEnvVersion: string): string[] {
    return this.migrationRegistry.versions.filter((migrationVersion) =>
      VersionToolbox.isLaterThan(migrationVersion, effectEnvVersion),
    )
  }

  /**
   * @see {@link TargetMigrationRegistry.migrate}
   */
  public migrateEffectArgs(version: string, effectArgs: AnyObject): AnyObject {
    return this.migrationRegistry.migrate(version, effectArgs)
  }

  /**
   * @param schema The schema defining the target.
   * @param environment The environment in which the target exists.
   * @returns A new {@link ServerTarget} instance created from the schema.
   */
  public static fromSchema(
    schema: TargetSchema,
    environment: ServerTargetEnvironment,
  ) {
    const target = new ServerTarget(
      schema._id,
      schema.name,
      schema.description,
      Arg.fromJson(schema.args),
      environment,
      schema.script,
      schema.migrationRegistry,
    )
    return target
  }

  /**
   * Ensures the current list of {@link ServerTarget.METIS_TARGET_IDS} exists
   * in the METIS target environment found within the target environment registry.
   * @param environmentId The ID of the target environment where the targets are defined.
   * @throws Error if any of the target IDs are not found.
   */
  public static validateTargetIds(environmentId: string): void {
    const metisTargetIds = Object.values(ServerTarget.METIS_TARGET_IDS)
    const targetIds = ServerTargetEnvironment.REGISTRY.getTargets(environmentId)
    const missingIds = targetIds.filter(
      ({ _id }) => !metisTargetIds.includes(_id),
    )

    if (missingIds.length > 0) {
      throw new Error(
        `The following target IDs are missing in the METIS target environment: ${missingIds
          .map(({ _id }) => _id)
          .join(', ')}`,
      )
    }
  }
}
