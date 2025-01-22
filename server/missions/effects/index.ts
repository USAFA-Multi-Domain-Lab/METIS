import Effect, { TEffectOptions } from 'metis/missions/effects'
import { TTargetEnvContextEffect } from 'metis/server/target-environments/context-provider'
import ServerTarget from 'metis/server/target-environments/targets'
import { TTargetArg } from 'metis/target-environments/args'
import ForceArg from 'metis/target-environments/args/force-arg'
import NodeArg from 'metis/target-environments/args/node-arg'
import { AnyObject } from 'metis/toolbox/objects'
import { TServerMissionTypes } from '..'

/**
 * Class representing an effect on the server-side that can be
 * applied to a target.
 */
export default class ServerEffect extends Effect<TServerMissionTypes> {
  /**
   * Populates the target data for the effect.
   * @param targetId The ID of the target to populate.
   */
  protected populateTargetData(targetId: string | null | undefined): void {
    // Get the target from the target environment.
    let target = ServerTarget.getTarget(targetId)

    // If the target is found, set it and update the target status to 'Populated'.
    if (target) {
      this._target = target
    } else {
      // Throw an error.
      let message: string =
        `Error loading target data for effect:\n` +
        `Effect: { name: "${this.name}", _id: "${this._id}" }`
      console.error(message)
    }
  }

  /**
   * Extracts the necessary properties from the effect's arguments to be used as a reference
   * in a target environment.
   * @param args The arguments to extract the necessary properties from.
   * @returns The modified arguments.
   */
  public argsToTargetEnvContext(args: AnyObject): AnyObject {
    // Copy the arguments.
    let argsCopy = { ...args }

    Object.entries(argsCopy).forEach(([key, value]) => {
      if (value[ForceArg.FORCE_NAME_KEY] !== undefined) {
        delete argsCopy[key][ForceArg.FORCE_NAME_KEY]
      }
      if (value[NodeArg.NODE_NAME_KEY] !== undefined) {
        delete argsCopy[key][NodeArg.NODE_NAME_KEY]
      }
    })

    // Return the modified arguments.
    return argsCopy
  }

  /**
   * Extracts the necessary properties from the effect to be used as a reference
   * in a target environment.
   * @returns The effect's necessary properties.
   */
  public toTargetEnvContext(): TTargetEnvContextEffect {
    return {
      _id: this._id,
      name: this.name,
      forceName: this.force.name,
      args: this.argsToTargetEnvContext(this.args),
    }
  }

  /**
   * Checks if there are any required target-arguments missing in the effect.
   * @returns The missing argument if there is one.
   */
  public checkForMissingArg(): TTargetArg | undefined {
    // If the target is not set, throw an error.
    if (!this.target) {
      throw new Error(
        `The effect ({ _id: "${this._id}", name: "${this.name}" }) does not have a target. ` +
          `This is likely because the target doesn't exist within any of the target environments stored in the registry.`,
      )
    }

    for (let arg of this.target.args) {
      // Check if all the dependencies for the argument are met.
      let allDependenciesMet: boolean = this.allDependenciesMet(
        arg.dependencies,
      )

      // If all the dependencies are met and the argument is not in the effect's arguments...
      if (allDependenciesMet && !(arg._id in this.args)) {
        // ...and the argument's type is a boolean or the argument is required, then return
        // the argument.
        // *** Note: A boolean argument is always required because it's value
        // *** is always defined.
        if (arg.type === 'boolean' || arg.required) {
          return arg
        }
      }
    }
  }

  /**
   * Sanitizes the arguments for the effect.
   */
  public sanitizeArgs(): void {
    // If the target is not set, throw an error.
    if (!this.target) {
      throw new Error(
        `The effect ({ _id: "${this._id}", name: "${this.name}" }) does not have a target. ` +
          `This is likely because the target doesn't exist within any of the target environments stored in the registry.`,
      )
    }
    // The sanitized arguments.
    let sanitizedArgs: ServerEffect['args'] = this.args

    // Loop through the target's arguments.
    for (let arg of this.target.args) {
      // Check if all the dependencies for the argument are met.
      let allDependenciesMet: boolean = this.allDependenciesMet(
        arg.dependencies,
      )

      // If any of the dependencies are not met and the argument is in the effect's arguments...
      if (!allDependenciesMet && arg._id in this.args) {
        // ...and the argument's type is a boolean or the argument is required, then remove the
        // argument.
        // *** Note: A boolean argument is always required because it's value
        // *** is always defined.
        if (arg.type === 'boolean' || arg.required) {
          delete sanitizedArgs[arg._id]
        }
      }
    }

    // Set the sanitized arguments.
    this.args = sanitizedArgs
  }
}

/* ------------------------------ SERVER EFFECT TYPES ------------------------------ */

/**
 * The options for creating a ServerEffect.
 */
export type TServerEffectOptions = TEffectOptions & {}

/**
 * The status on whether the target for the effect has been populated.
 */
export type TServerTargetStatus =
  | 'Populated'
  | 'Populating'
  | 'Not Populated'
  | 'Error'
