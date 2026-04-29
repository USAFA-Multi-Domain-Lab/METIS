import type { TTargetParameter } from '@shared/target-environments/parameters/TargetParameter'
import { TargetParameter } from '@shared/target-environments/parameters/TargetParameter'
import type { TTargetJson } from '@shared/target-environments/targets/Target'
import { Target } from '@shared/target-environments/targets/Target'
import type { TMetisClientComponents } from '..'
import type { ClientTargetEnvironment } from './ClientTargetEnvironment'

/**
 * Class representing a target within a target environment
 * on the client-side.
 */
export class ClientTarget extends Target<TMetisClientComponents> {
  /**
   * @see {@link Target.migrationVersions}
   */
  private _migrationVersions: string[]
  // Implemented
  public get migrationVersions(): string[] {
    return this._migrationVersions
  }

  protected constructor(
    _id: string,
    name: string,
    description: string,
    parameters: TTargetParameter[],
    migrationVersions: string[],
    environment: ClientTargetEnvironment,
  ) {
    super(_id, name, description, parameters, environment)
    this._migrationVersions = migrationVersions
  }

  /**
   * @returns A new {@link ClientTarget} instance
   * with default values.
   */
  public static createBlank(
    environment: ClientTargetEnvironment,
  ): ClientTarget {
    return new ClientTarget(
      ClientTarget.DEFAULT_PROPERTIES._id,
      ClientTarget.DEFAULT_PROPERTIES.name,
      ClientTarget.DEFAULT_PROPERTIES.description,
      TargetParameter.fromJson(ClientTarget.DEFAULT_PROPERTIES.parameters),
      ClientTarget.DEFAULT_PROPERTIES.migrationVersions,
      environment,
    )
  }

  /**
   * @param json The JSON representation of the target.
   * @param environment The environment in which the target exists.
   * @returns A new {@link ClientTarget} instance created
   * from the JSON.
   */
  public static fromJson(
    json: TTargetJson,
    environment: ClientTargetEnvironment,
  ): ClientTarget {
    return new ClientTarget(
      json._id,
      json.name,
      json.description,
      TargetParameter.fromJson(json.parameters),
      json.migrationVersions,
      environment,
    )
  }
}
