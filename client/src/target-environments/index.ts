import axios from 'axios'
import ClientMission, { TClientMissionTypes } from 'src/missions'
import TargetEnvironment, {
  TCommonTargetEnvJson,
} from '../../../shared/target-environments'
import { TDropdownArgOption } from '../../../shared/target-environments/args/dropdown-arg'
import { TCommonTargetJson } from '../../../shared/target-environments/targets'
import ClientTarget from './targets'

/**
 * Class representing a target environment on the client-side.
 */
export class ClientTargetEnvironment extends TargetEnvironment<TClientMissionTypes> {
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
   * @param _id The ID of the target environment to fetch.
   * @resolves If the target environment is fetched successfully.
   * @rejects If there is an error fetching the target environment.
   */
  public static $fetchOne(
    _id: ClientTargetEnvironment['_id'],
  ): Promise<ClientTargetEnvironment> {
    return new Promise<ClientTargetEnvironment>(async (resolve, reject) => {
      try {
        // Fetch the target environment from the API.
        let response = await axios.get<TCommonTargetEnvJson>(
          `${ClientTargetEnvironment.API_ENDPOINT}/${_id}/`,
        )
        // Parse the response data.
        let data: TCommonTargetEnvJson = response.data
        // Create a new ClientTargetEnvironment Object.
        let targetEnvironment: ClientTargetEnvironment =
          new ClientTargetEnvironment(data)
        // Return the new ClientTargetEnvironment Object.
        resolve(targetEnvironment)
      } catch (error: any) {
        console.error(`Failed to load target environment with ID ${_id}.`)
        console.error(error)
        reject(error)
      }
    })
  }

  /**
   * Calls the API to fetch all target environments.
   * @resolves If the target environments are fetched successfully.
   * @rejects If there is an error fetching the target environments.
   */
  public static $fetchAll(): Promise<ClientTargetEnvironment[]> {
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

  /**
   * Updates the target environment on the server.
   * @param clientTargetEnv The target environment to update.
   * @resolves If the target environment is updated successfully.
   * @rejects If there is an error updating the target environment.
   */
  private static $update(
    clientTargetEnv: ClientTargetEnvironment,
  ): Promise<ClientTargetEnvironment> {
    return new Promise<ClientTargetEnvironment>(async (resolve, reject) => {
      try {
        // Update the target environment on the server.
        let response = await axios.put<TCommonTargetEnvJson>(
          `${ClientTargetEnvironment.API_ENDPOINT}`,
          clientTargetEnv.toJson(),
        )
        // Return the updated ClientTargetEnvironment Object.
        resolve(new ClientTargetEnvironment(response.data))
      } catch (error: any) {
        console.error(
          `Failed to update target environment with ID ${clientTargetEnv._id}.`,
        )
        console.error(error)
        reject(error)
      }
    })
  }

  /**
   * Generates dropdown options for an argument in a target environment.
   * @param targetEnv The target environment containing the argument.
   * @param mission The mission with the effect that uses the target environment.
   * @param argId The ID of the argument to update.
   * @param options The new options for the argument.
   * @resolves If the dropdown options are generated successfully.
   * @rejects If there is an error generating the dropdown options.
   */
  public static async generateDropdownOptions(
    targetEnv: ClientTargetEnvironment,
    mission: ClientMission,
    argId: string,
    options: TDropdownArgOption[],
  ) {
    // Find the target that contains the argument.
    let target = targetEnv.targets.find((target) =>
      target.args.find((arg) => arg._id === argId),
    )
    // Find the argument.
    let arg = target?.args.find((arg) => arg._id === argId)
    // Update the argument with the new options.
    if (arg && arg.type === 'dropdown') {
      arg.options = options
    }
    // Update the internal target environment on the server.
    let updatedTargetEnv = await ClientTargetEnvironment.$update(targetEnv)

    // Iterate through the mission's forces to find the effect
    // with the same target that was just updated.
    mission.forces.forEach(async (force) => {
      // Iterate through the force's nodes to find the effect
      // with the same target that was just updated.
      force.nodes.forEach(async (node) => {
        // Iterate through the node's actions to find the effect
        // with the same target that was just updated.
        node.actions.forEach(async (action) => {
          // Iterate through the action's effects to find the effect
          // with the same target that was just updated.
          action.effects.forEach(async (effect) => {
            // If the effect has the same target as the updated target,
            // update the effect's target as well.
            if (effect.targetEnvironment._id === targetEnv._id) {
              // Find the updated target in the updated target environment.
              let updatedTarget = updatedTargetEnv.targets.find(
                (target) => target._id === effect.target?._id,
              )

              // If the updated target is found, update the effect's target.
              if (updatedTarget) {
                effect.target = updatedTarget
              }
            }
          })
        })
      })
    })
  }
}
