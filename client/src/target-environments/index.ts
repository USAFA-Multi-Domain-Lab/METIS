import axios from 'axios'
import TargetEnvironment, {
  TCommonTargetEnvJson,
} from '../../../shared/target-environments'
import { TCommonTargetJson } from '../../../shared/target-environments/targets'
import ClientTarget from './targets'

/**
 * Class representing a target environment on the client-side.
 */
export class ClientTargetEnvironment extends TargetEnvironment<ClientTarget> {
  // Implemented
  public parseTargets(data: TCommonTargetJson[]): ClientTarget[] {
    return data.map((datum: TCommonTargetJson) => {
      return new ClientTarget(this, datum)
    })
  }

  /**
   * The API endpoint for managing target environments.
   */
  public static readonly API_ENDPOINT: string = '/api/v1/target-environments'

  /**
   * Calls the API to fetch one target environment by ID.
   * @param targetEnvId The ID of the target environment to fetch.
   * @returns A promise that resolves to a ClientTargetEnvironment Object.
   */
  public static async fetchOne(
    targetEnvId: ClientTargetEnvironment['_id'],
  ): Promise<ClientTargetEnvironment> {
    return new Promise<ClientTargetEnvironment>(async (resolve, reject) => {
      try {
        // Fetch the target environment from the API.
        let response = await axios.get<TCommonTargetEnvJson>(
          `${ClientTargetEnvironment.API_ENDPOINT}`,
          { params: { targetEnvId } },
        )
        // Parse the response data.
        let data: TCommonTargetEnvJson = response.data
        // Create a new ClientTargetEnvironment Object.
        let targetEnvironment: ClientTargetEnvironment =
          new ClientTargetEnvironment(data)
        // Return the new ClientTargetEnvironment Object.
        resolve(targetEnvironment)
      } catch (error: any) {
        console.error(
          `Failed to load target environment with ID ${targetEnvId}.`,
        )
        console.error(error)
        reject(error)
      }
    })
  }

  /**
   * Calls the API to fetch all target environments.
   * @returns {Promise<ClientTargetEnvironment[]>} A promise that resolves to an array of ClientTargetEnvironment Objects.
   */
  public static async fetchAll(): Promise<ClientTargetEnvironment[]> {
    return new Promise<ClientTargetEnvironment[]>(async (resolve, reject) => {
      try {
        // Fetch the target environments from the API.
        let response = await axios.get<TCommonTargetEnvJson[]>(
          `${ClientTargetEnvironment.API_ENDPOINT}`,
        )
        // Parse the response data.
        let data: TCommonTargetEnvJson[] = response.data
        // Create an array of ClientTargetEnvironment Objects.
        let targetEnvironments: ClientTargetEnvironment[] = data.map(
          (datum: TCommonTargetEnvJson) => new ClientTargetEnvironment(datum),
        )
        // Return the array of ClientTargetEnvironment Objects.
        resolve(targetEnvironments)
      } catch (error: any) {
        console.error('Failed to load target environments.')
        console.error(error)
        reject(error)
      }
    })
  }
}
