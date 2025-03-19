import { TTargetEnvJson } from 'metis/target-environments'
import Target, { TTargetJson } from 'metis/target-environments/targets'
import ServerTargetEnvironment from '.'
import { TMetisServerComponents } from '../index'

/**
 * A class for managing targets on the server.
 */
export default class ServerTarget extends Target<TMetisServerComponents> {
  /**
   * Grabs a specific target from a target environment by its ID.
   * @param id The ID of the target to grab.
   * @returns The target with the provided ID.
   */
  public static getTarget(
    id: string | null | undefined,
  ): ServerTarget | undefined {
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
  public static getTargetJson(id: string): TTargetJson | undefined {
    // Get all the target environment JSON.
    let targetEnvArrayJson: TTargetEnvJson[] =
      ServerTargetEnvironment.getAllJson()

    // Declare the target JSON.
    let targetJson: TTargetJson | undefined

    // Iterate over the target environment JSON.
    for (let targetEnvJson of targetEnvArrayJson) {
      // Find the target JSON that matches the ID.
      targetJson = targetEnvJson.targets.find(
        (target: TTargetJson) => target._id === id,
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
