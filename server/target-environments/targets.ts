import { TCommonTargetEnvJson } from 'metis/target-environments'
import Target, { TCommonTargetJson } from 'metis/target-environments/targets'
import ServerTargetEnvironment from '.'

/**
 * A class for managing targets on the server.
 */
export default class ServerTarget extends Target<ServerTargetEnvironment> {
  /**
   * Grabs a specific target from a target environment by its ID.
   * @param id The ID of the target to grab.
   * @returns The target with the provided ID.
   */
  public static getTarget(id: string): ServerTarget | undefined {
    // Get all the target environments.
    let targetEnvironments: ServerTargetEnvironment[] =
      ServerTargetEnvironment.getAll()

    // Declare the target.
    let target: ServerTarget | undefined

    // Iterate over the target environments.
    for (let targetEnvironment of targetEnvironments) {
      // Find the target that matches the ID.
      target = targetEnvironment.targets.find(
        (target: ServerTarget) => target._id === id,
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
   * Grabs a specific target JSON from a target environment by its ID.
   * @param id The ID of the target to grab.
   * @returns The target JSON with the provided ID.
   */
  public static getTargetJson(id: string): TCommonTargetJson | undefined {
    // Get all the target environment JSON.
    let targetEnvArrayJson: TCommonTargetEnvJson[] =
      ServerTargetEnvironment.getAllJson()

    // Declare the target JSON.
    let targetJson: TCommonTargetJson | undefined

    // Iterate over the target environment JSON.
    for (let targetEnvJson of targetEnvArrayJson) {
      // Find the target JSON that matches the ID.
      targetJson = targetEnvJson.targets.find(
        (target: TCommonTargetJson) => target._id === id,
      )

      // If the target JSON is found, break the loop.
      if (targetJson) {
        break
      }
    }

    // Return the target JSON.
    return targetJson
  }
}
