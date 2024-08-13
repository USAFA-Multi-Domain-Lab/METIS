import Effect, { TEffectOptions } from 'metis/missions/effects'
import { TTargetEnvContextEffect } from 'metis/server/target-environments/context-provider'
import ServerTarget from 'metis/server/target-environments/targets'
import { TTargetArg } from 'metis/target-environments/args'
import ForceArg from 'metis/target-environments/args/force-arg'
import NodeArg from 'metis/target-environments/args/node-arg'
import Dependency from 'metis/target-environments/dependencies'
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
      throw new Error(message)
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
      args: this.argsToTargetEnvContext(this.args),
    }
  }

  /**
   * Checks if all the dependencies for the given argument are met.
   * @param target The target to check the effect against.
   * @param argDependencies The dependencies for the argument.
   * @param effectArgs The arguments stored in the effect.
   * @returns A boolean indicating if all the dependencies
   * for the argument are met.
   * @note If the argument has no dependencies, then the dependencies are met.
   */
  private static allDependenciesMet(
    target: ServerTarget,
    argDependencies: Dependency[] | undefined,
    effectArgs: ServerEffect['args'],
  ): boolean {
    // Stores the status of all the argument's dependencies.
    let areDependenciesMet: boolean[] = []

    // If the argument has no dependencies, then the dependencies are met.
    if (!argDependencies || argDependencies.length === 0) {
      areDependenciesMet = [true]
    }
    // Otherwise, check if the dependencies are met.
    else {
      argDependencies.forEach((dependency) => {
        // Grab the dependency argument.
        let dependencyArg: TTargetArg | undefined = target.args.find(
          (arg: TTargetArg) => arg._id === dependency.dependentId,
        )

        // If the dependency argument is found and the dependency
        // is not blacklisted, then check if the dependency is met.
        if (
          dependencyArg &&
          !Dependency.blacklistedDependencies.includes(dependency.name)
        ) {
          // Check if the dependency is met.
          let dependencyMet: boolean = dependency.condition(
            effectArgs[dependency.dependentId],
          )

          // If the dependency is met then push true to the
          // dependencies met array, otherwise push false.
          dependencyMet
            ? areDependenciesMet.push(true)
            : areDependenciesMet.push(false)
        }
        // Otherwise, the dependency argument doesn't exist.
        else {
          areDependenciesMet.push(false)
        }
      })
    }

    // Return true if all the dependencies are met, otherwise return false.
    return !areDependenciesMet.includes(false)
  }

  /**
   * Checks if there are any required target-arguments missing in the effect.
   * @param target The target to check the effect against.
   * @param effectArgs The arguments stored in the effect.
   * @returns A boolean indicating if there are any missing arguments.
   */
  public static checkForMissingArg(
    target: ServerTarget,
    effectArgs: ServerEffect['args'],
  ): TTargetArg | undefined {
    for (let arg of target.args) {
      // Check if all the dependencies for the argument are met.
      let allDependenciesMet: boolean = this.allDependenciesMet(
        target,
        arg.dependencies,
        effectArgs,
      )

      // If all the dependencies are met and the argument is not in the effect's arguments...
      if (allDependenciesMet && !(arg._id in effectArgs)) {
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
   * @param target The target to check the effect against.
   * @param effectArgs The arguments stored in the effect.
   * @returns The sanitized arguments.
   */
  public static sanitizeArgs(
    target: ServerTarget,
    effectArgs: ServerEffect['args'],
  ): ServerEffect['args'] {
    // The sanitized arguments.
    let sanitizedArgs: ServerEffect['args'] = effectArgs

    // Loop through the target's arguments.
    for (let arg of target.args) {
      // Check if all the dependencies for the argument are met.
      let allDependenciesMet: boolean = this.allDependenciesMet(
        target,
        arg.dependencies,
        effectArgs,
      )

      // If any of the dependencies are not met and the argument is in the effect's arguments...
      if (!allDependenciesMet && arg._id in effectArgs) {
        // ...and the argument's type is a boolean or the argument is required, then remove the
        // argument.
        // *** Note: A boolean argument is always required because it's value
        // *** is always defined.
        if (arg.type === 'boolean' || arg.required) {
          delete sanitizedArgs[arg._id]
        }
      }
    }

    return sanitizedArgs
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
