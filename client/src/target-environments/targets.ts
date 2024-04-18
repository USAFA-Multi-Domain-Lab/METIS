import axios from 'axios'
import { ClientTargetEnvironment } from '.'
import Target, {
  TCommonTarget,
  TCommonTargetJson,
} from '../../../shared/target-environments/targets'

/**
 * Class representing a target within a target environment
 * on the client-side.
 */
export default class ClientTarget extends Target<ClientTargetEnvironment> {
  /**
   * The API endpoint for TargetEnvironment Objects.
   */
  public static readonly API_ENDPOINT: string =
    'api/v1/target-environments/targets'

  /**
   * Calls the API to load the target with the specified ID.
   * @param targetId The ID of the target to fetch.
   * @returns A promise that resolves to a ClientTarget Object.
   */
  public static async fetchOne(
    targetId: TCommonTarget['_id'],
  ): Promise<ClientTarget> {
    return new Promise<ClientTarget>(async (resolve, reject) => {
      try {
        // Load the target from the API.
        let response = await axios.get<TCommonTargetJson>(
          `${ClientTarget.API_ENDPOINT}`,
          { params: { targetId } },
        )
        // Parse the response data.
        let data: TCommonTargetJson = response.data
        // Load the target's environment.
        let targetEnvironment: ClientTargetEnvironment =
          await ClientTargetEnvironment.fetchOne(data.targetEnvId)
        // Create a new Target Object.
        let target: ClientTarget = new ClientTarget(targetEnvironment, data)
        // Return the new Target Object.
        resolve(target)
      } catch (error: any) {
        console.error(`Failed to load target with ID ${targetId}.`)
        console.error(error)
        reject(error)
      }
    })
  }
}
