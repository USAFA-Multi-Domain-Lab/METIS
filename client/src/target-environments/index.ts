import axios from 'axios'
import { ClientEffect } from 'metis/client/missions/effects'
import TargetEnvironment, { TTargetEnvJson } from 'metis/target-environments'
import TargetEnvRegistry from 'metis/target-environments/registry'
import { TTargetJson } from 'metis/target-environments/targets'
import { AnyObject } from 'metis/toolbox'
import { TMetisClientComponents } from 'src'
import ClientTarget from './targets'

/**
 * Class representing a target environment on the client-side.
 */
export class ClientTargetEnvironment extends TargetEnvironment<TMetisClientComponents> {
  protected constructor(
    _id: string,
    name: string,
    description: string,
    version: string,
    targetData: TTargetJson[],
  ) {
    super(_id, name, description, version)

    this.targets = targetData.map((target) =>
      ClientTarget.fromJson(target, this),
    )
  }

  // Implemented
  public register(): ClientTargetEnvironment {
    ClientTargetEnvironment.REGISTRY.register(this)
    return this
  }

  /**
   * The API endpoint for managing target environments.
   */
  public static readonly API_ENDPOINT: string = '/api/v1/target-environments'

  /**
   * A registry of all target environments installed
   * on the server and provided to the client.
   */
  public static readonly REGISTRY: TargetEnvRegistry<TMetisClientComponents> =
    new TargetEnvRegistry()

  /**
   * @returns A new {@link ClientTargetEnvironment} instance
   * with default values.
   */
  public static createBlank(): ClientTargetEnvironment {
    return new ClientTargetEnvironment(
      ClientTargetEnvironment.DEFAULT_PROPERTIES._id,
      ClientTargetEnvironment.DEFAULT_PROPERTIES.name,
      ClientTargetEnvironment.DEFAULT_PROPERTIES.description,
      ClientTargetEnvironment.DEFAULT_PROPERTIES.version,
      ClientTargetEnvironment.DEFAULT_PROPERTIES.targets,
    )
  }

  /**
   * @param json The JSON representation of the target environment.
   * @returns A new {@link ClientTargetEnvironment} instance created
   * from the JSON.
   */
  public static fromJson(json: TTargetEnvJson): ClientTargetEnvironment {
    return new ClientTargetEnvironment(
      json._id,
      json.name,
      json.description,
      json.version,
      json.targets,
    )
  }

  /**
   * Populates the registry with the target environments
   * found on the server.
   * @resolves If the target environments are successfully loaded.
   * @rejects If there is an error loading the target environments.
   * @note The registry will be cleared before population.
   */
  public static $populateRegistry(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        // Wipe the registry.
        ClientTargetEnvironment.REGISTRY.clear()

        // Fetch the target environments from the API.
        let { data } = await axios.get<TTargetEnvJson[]>(
          `${ClientTargetEnvironment.API_ENDPOINT}`,
        )
        // Create new target environments from the data.
        data.map((datum) => ClientTargetEnvironment.fromJson(datum).register())
      } catch (error: any) {
        console.error('Failed to load target environments.')
        console.error(error)
        reject(error)
      }
    })
  }

  public static async $migrateEffectArgs(
    effect: ClientEffect,
  ): Promise<TMigrateEffectArgsResults> {
    try {
      const response = await axios.post<TMigrateEffectArgsResults>(
        `${ClientTargetEnvironment.API_ENDPOINT}/migrate/effect-args`,
        {
          targetId: effect.targetId,
          environmentId: effect.environmentId,
          effectEnvVersion: effect.targetEnvironmentVersion,
          effectArgs: effect.args,
        },
      )
      return response.data
    } catch (error: any) {
      console.error('Failed to migrate effect args.')
      console.error(error)
      throw error
    }
  }
}

/**
 * The results returned in the response of the
 * {@link ClientTargetEnvironment.$migrateEffectArgs} method.
 */
export interface TMigrateEffectArgsResults {
  /**
   * The version the args with which the effect
   * args are now compatible.
   */
  resultingVersion: string
  /**
   * The resulting effect args after migration.
   */
  resultingArgs: AnyObject
}
