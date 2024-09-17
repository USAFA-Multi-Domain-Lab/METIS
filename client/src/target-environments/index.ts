import axios from 'axios'
import { TClientMissionTypes } from 'src/missions'
import ClientUser from 'src/users'
import TargetEnvironment, {
  TCommonTargetEnvJson,
  TTargetEnvOptions,
} from '../../../shared/target-environments'
import { TCommonTargetJson } from '../../../shared/target-environments/targets'
import ClientTarget from './targets'

/**
 * Class representing a target environment on the client-side.
 */
export class ClientTargetEnvironment extends TargetEnvironment<TClientMissionTypes> {
  /**
   * A registry of all target environments.
   */
  private static registry: ClientTargetEnvironment[] = []
  /**
   * Grabs all the target environments from the registry.
   * @returns An array of all the target environments in the
   * registry.
   */
  public static getAll(): ClientTargetEnvironment[] {
    return ClientTargetEnvironment.registry
  }

  /**
   * Grabs a target environment from the registry by its ID.
   * @param id The ID of the target environment to grab.
   * @returns A target environment with the provided ID.
   */
  public static get(id: string): ClientTargetEnvironment | undefined {
    return ClientTargetEnvironment.registry.find(
      (targetEnvironment) => targetEnvironment._id === id,
    )
  }

  // Implemented
  protected parseTargets(data: TCommonTargetJson[]): ClientTarget[] {
    return data.map((datum: TCommonTargetJson) => {
      return new ClientTarget(this, datum)
    })
  }

  /**
   * The API endpoint for managing target environments.
   */
  public static readonly API_ENDPOINT: string = '/api/v1/target-environments'

  /**
   * Loads all target environments via the API.
   * @param user The user to load the target environments for.
   * @resolves If the target environments are successfully loaded.
   * @rejects If there is an error loading the target environments.
   */
  public static $loadAll(user: ClientUser): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        // Add the target environments to the registry if the user is authorized.
        if (
          user.isAuthorized('environments_read') &&
          ClientTargetEnvironment.registry.length === 0
        ) {
          // Fetch the target environments from the API.
          let response = await axios.get<TCommonTargetEnvJson[]>(
            `${ClientTargetEnvironment.API_ENDPOINT}`,
          )
          // Parse the response data.
          let data = response.data
          // Create an array of ClientTargetEnvironment Objects.
          let targetEnvironments = data.map(
            (datum) => new ClientTargetEnvironment(datum),
          )
          // Add the target environments to the registry.
          ClientTargetEnvironment.registry = targetEnvironments
          // Resolve the promise.
          resolve()
        }
        // Otherwise, clear the registry if the user is not authorized.
        else if (
          !user.isAuthorized('environments_read') &&
          ClientTargetEnvironment.registry.length > 0
        ) {
          ClientTargetEnvironment.registry = []
          // Resolve the promise.
          resolve()
        }
      } catch (error: any) {
        console.error('Failed to load target environments.')
        console.error(error)
        reject(error)
      }
    })
  }
}

/* ------------------------------ CLIENT TARGET ENVIRONMENT TYPES ------------------------------ */

/**
 * Options for creating a new ClientTargetEnvironment object.
 */
export type TClientTargetEnvOptions = TTargetEnvOptions & {}
