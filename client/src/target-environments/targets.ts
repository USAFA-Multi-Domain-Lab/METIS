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
   * @param {TCommonTarget['id']} targetId The ID of the target to fetch.
   * @returns {Promise<ClientTarget>} A promise that resolves to a ClientTarget Object.
   */
  public static async fetchOne(
    targetId: TCommonTarget['id'],
  ): Promise<ClientTarget> {
    // Load the target from the API.
    let response = await axios.get<TCommonTargetJson>(
      `${ClientTarget.API_ENDPOINT}`,
      { params: { targetId } },
    )
    // Parse the response data.
    let data: TCommonTargetJson = response.data
    // Load the target's environment.
    let targetEnvironment: ClientTargetEnvironment =
      await ClientTargetEnvironment.fetchOne(data.targetEnvironmentId)
    // Create a new Target Object.
    let target: ClientTarget = new ClientTarget(targetEnvironment, data)
    // Return the new Target Object.
    return target
  }
}
