import axios from 'axios'
import TargetEnvironment, {
  TCommonTargetEnvironmentJson,
} from '../../../shared/target-environments'
import ClientTarget from './targets'
import { TCommonTargetJson } from '../../../shared/target-environments/targets'

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
   * @param {ClientTargetEnvironment['id']} targetEnvironmentId The ID of the target environment to fetch.
   * @returns {Promise<ClientTargetEnvironment>} A promise that resolves to a ClientTargetEnvironment Object.
   */
  public static async fetchOne(
    targetEnvironmentId: ClientTargetEnvironment['id'],
  ): Promise<ClientTargetEnvironment> {
    try {
      // Fetch the target environment from the API.
      let response = await axios.get<TCommonTargetEnvironmentJson>(
        `${ClientTargetEnvironment.API_ENDPOINT}`,
        { params: { targetEnvironmentId } },
      )
      // Parse the response data.
      let data: TCommonTargetEnvironmentJson = response.data
      // Create a new ClientTargetEnvironment Object.
      let targetEnvironment: ClientTargetEnvironment =
        new ClientTargetEnvironment(data)
      // Return the new ClientTargetEnvironment Object.
      return targetEnvironment
    } catch (error: any) {
      console.error(
        `Failed to load target environment with ID ${targetEnvironmentId}.`,
      )
      console.error(error)
      throw error
    }
  }

  /**
   * Calls the API to fetch all target environments.
   * @returns {Promise<ClientTargetEnvironment[]>} A promise that resolves to an array of ClientTargetEnvironment Objects.
   */
  public static async fetchAll(): Promise<ClientTargetEnvironment[]> {
    try {
      // Fetch the target environments from the API.
      let response = await axios.get<TCommonTargetEnvironmentJson[]>(
        `${ClientTargetEnvironment.API_ENDPOINT}`,
      )
      // Parse the response data.
      let data: TCommonTargetEnvironmentJson[] = response.data
      // Create an array of ClientTargetEnvironment Objects.
      let targetEnvironments: ClientTargetEnvironment[] = data.map(
        (datum: TCommonTargetEnvironmentJson) =>
          new ClientTargetEnvironment(datum),
      )
      // Return the array of ClientTargetEnvironment Objects.
      return targetEnvironments
    } catch (error: any) {
      console.error('Failed to load target environments.')
      console.error(error)
      throw error
    }
  }
}
