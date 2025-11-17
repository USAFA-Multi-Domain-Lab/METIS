import type { TargetSchema } from '@server/target-environments/schema/TargetSchema'
import type { TTargetArg } from '@shared/target-environments/args/Arg'
import { Arg } from '@shared/target-environments/args/Arg'
import { Target } from '@shared/target-environments/targets/Target'
import type { TAnyObject } from '@shared/toolbox/objects/ObjectToolbox'
import { VersionToolbox } from '@shared/toolbox/strings/VersionToolbox'
import type { TargetMigrationRegistry } from '../../shared/target-environments/targets/migrations/TargetMigrationRegistry'
import { ServerTargetEnvironment } from './ServerTargetEnvironment'
import type { TTargetEnvExposedTarget } from './context/TargetEnvContext'

/**
 * A class for managing targets on the server.
 */
export class ServerTarget extends Target<TMetisServerComponents> {
  // Implemented
  public get migrationVersions(): string[] {
    return this.migrationRegistry.versions
  }

  /**
   * @see {@link ServerTargetEnvironment.sandbox}
   */
  public get sandbox() {
    return this.environment.sandbox
  }

  protected constructor(
    _id: string,
    name: string,
    description: string,
    args: TTargetArg[] = [],
    environment: ServerTargetEnvironment,
    /**
     * The path to the schema which defines the target.
     */
    public schemaPath: string,
    /**
     * A registry of target-environment versions which have
     * a migration script for the target.
     */
    public migrationRegistry: TargetMigrationRegistry,
  ) {
    super(_id, name, description, args, environment)
  }

  /**
   * @returns The properties from the target that are
   * safe to expose in target-environment code.
   */
  public toTargetEnvContext(): TTargetEnvExposedTarget {
    const self = this
    return {
      _id: self._id,
      name: self.name,
      description: self.description,
      get environment() {
        return self.environment.toTargetEnvContext()
      },
    }
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
  public migrateEffectArgs(
    version: string,
    effectArgs: TAnyObject,
  ): TAnyObject {
    return this.migrationRegistry.migrate(version, effectArgs)
  }

  /**
   * @param schema The schema defining the target.
   * @param environment The environment in which the target exists.
   * @param path The path to the schema file.
   * @returns A new {@link ServerTarget} instance created from the schema.
   */
  public static fromSchema(
    schema: TargetSchema,
    environment: ServerTargetEnvironment,
    path: string,
  ) {
    const target = new ServerTarget(
      schema._id,
      schema.name,
      schema.description,
      Arg.fromJson(schema.args),
      environment,
      path,
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
    const targets = ServerTargetEnvironment.REGISTRY.getTargets(environmentId)
    const missingTargets = targets.filter(
      ({ _id }) => !metisTargetIds.includes(_id),
    )

    if (missingTargets.length > 0) {
      throw new Error(
        `The following target IDs are missing in the METIS target environment: ${missingTargets
          .map(({ _id }) => _id)
          .join(', ')}`,
      )
    }
  }
}
