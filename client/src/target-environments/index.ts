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
   * Calls the API to fetch all target environments.
   * @returns {Promise<ClientTargetEnvironment[]>} A promise that resolves to an array of ClientTargetEnvironment Objects.
   */
  public static async fetchAll(): Promise<ClientTargetEnvironment[]> {
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
      return targetEnvironments
    } catch (error: any) {
      console.error('Failed to load target environments.')
      console.error(error)
      throw error
    }
  }
}
