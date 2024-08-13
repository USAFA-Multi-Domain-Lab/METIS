import { TClientMissionTypes } from 'src/missions'
import { ClientTargetEnvironment } from '.'
import Target from '../../../shared/target-environments/targets'

/**
 * Class representing a target within a target environment
 * on the client-side.
 */
export default class ClientTarget extends Target<TClientMissionTypes> {
  /**
   * Grabs a specific target from a target environment by its ID.
   * @param id The ID of the target to grab.
   * @returns The target with the provided ID.
   */
  public static getTarget(
    id: string | null | undefined,
  ): ClientTarget | undefined {
    // Get all the target environments.
    let targetEnvironments: ClientTargetEnvironment[] =
      ClientTargetEnvironment.getAll()

    // Declare the target.
    let target: ClientTarget | undefined

    // Iterate over the target environments.
    for (let targetEnvironment of targetEnvironments) {
      // Find the target that matches the ID.
      target = targetEnvironment.targets.find(
        (target: ClientTarget) => target._id === id,
      )

      // If the target is found, break the loop.
      if (target) {
        break
      }
    }

    // Return the target.
    return target
  }

  /**
   * The API endpoint for Target Objects.
   */
  public static readonly API_ENDPOINT: string =
    'api/v1/target-environments/targets'
}
