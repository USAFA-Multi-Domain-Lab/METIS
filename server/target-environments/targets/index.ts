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
}
