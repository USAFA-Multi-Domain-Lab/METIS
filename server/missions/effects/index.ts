import Effect from 'metis/missions/effects'
import { TMetisServerComponents } from 'metis/server'
import ServerTargetEnvironment from 'metis/server/target-environments'
import { TTargetEnvExposedEffect } from 'metis/server/target-environments/context'
import ServerTarget from 'metis/server/target-environments/targets'
import ForceArg from 'metis/target-environments/args/mission-component/force-arg'
import NodeArg from 'metis/target-environments/args/mission-component/node-arg'
import { AnyObject } from 'metis/toolbox/objects'

/**
 * Class representing an effect on the server-side that can be
 * applied to a target.
 */
export default class ServerEffect extends Effect<TMetisServerComponents> {
  // Implemented
  protected determineTarget(
    targetId: string,
    environmentId: string,
  ): ServerTarget | null {
    if (environmentId === ServerEffect.ENVIRONMENT_ID_INFER) {
      return ServerTargetEnvironment.REGISTRY.inferTarget(targetId) ?? null
    } else {
      return (
        ServerTargetEnvironment.REGISTRY.getTarget(targetId, environmentId) ??
        null
      )
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
      if (value[ForceArg.FORCE_NAME] !== undefined) {
        delete argsCopy[key][ForceArg.FORCE_NAME]
      }
      if (value[NodeArg.NODE_NAME] !== undefined) {
        delete argsCopy[key][NodeArg.NODE_NAME]
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
  public toTargetEnvContext(): TTargetEnvExposedEffect {
    return {
      _id: this._id,
      name: this.name,
      forceName: this.force.name,
      args: this.argsToTargetEnvContext(this.args),
    }
  }

  /**
   * Sanitizes the arguments for the effect.
   * todo: This is not currently used. Reevaluate if this is needed in the future.
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
 * The status on whether the target for the effect has been populated.
 */
export type TServerTargetStatus =
  | 'Populated'
  | 'Populating'
  | 'Not Populated'
  | 'Error'
