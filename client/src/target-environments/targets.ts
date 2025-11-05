import Arg, { TTargetArg } from 'metis/target-environments/args'
import Target, { TTargetJson } from 'metis/target-environments/targets'
import { TMetisClientComponents } from 'src'
import { ClientTargetEnvironment } from '.'

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
    args: TTargetArg[],
    migrationVersions: string[],
    environment: ClientTargetEnvironment,
  ) {
    super(_id, name, description, args, environment)
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
      Arg.fromJson(ClientTarget.DEFAULT_PROPERTIES.args),
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
      Arg.fromJson(json.args),
      json.migrationVersions,
      environment,
    )
  }
}
