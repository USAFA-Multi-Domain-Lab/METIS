import Effect, {
  TCommonEffectJson,
  TEffectOptions,
} from 'metis/missions/effects'
import ServerTargetEnvironment from 'metis/server/target-environments'
import { TTargetEnvContextEffect } from 'metis/server/target-environments/context-provider'
import ServerTarget from 'metis/server/target-environments/targets'
import { TTargetArg } from 'metis/target-environments/args'
import ForceArg from 'metis/target-environments/args/force-arg'
import NodeArg from 'metis/target-environments/args/node-arg'
import { AnyObject } from 'metis/toolbox/objects'
import { TServerMissionTypes } from '..'
import ServerMissionAction from '../actions'

/**
 * Class representing an effect on the server-side that can be
 * applied to a target.
 */
export default class ServerEffect extends Effect<TServerMissionTypes> {
  /**
   * The status on whether the target for the effect has been populated.
   */
  private _targetStatus: TServerTargetStatus
  /**
   * The status on whether the target for the effect has been populated.
   */
  public get targetStatus(): TServerTargetStatus {
    return this._targetStatus
  }

  // Implemented
  public get targetEnvironment(): ServerTargetEnvironment | null {
    if (this.target instanceof ServerTarget) {
      return this.target.targetEnvironment
    } else {
      return null
    }
  }

  /**
   * @param action The action to which the effect belongs.
   * @param data The data to use to create the Effect.
   * @param options The options for creating the Effect.
   */
  public constructor(
    action: ServerMissionAction,
    data: Partial<TCommonEffectJson> = ServerEffect.DEFAULT_PROPERTIES,
    options: TServerEffectOptions = {},
  ) {
    super(action, data, options)

    this._targetStatus = 'Not Populated'
  }

  // Implemented
  public populateTargetData(): void {
    if (!this.targetId) {
      throw new Error(
        `The effect "${this.name}" has no target ID. { targetId: "${this.targetId}" }`,
      )
    }

    // Set the target status to 'Populating'.
    this._targetStatus = 'Populating'
    // Get the target from the target environment.
    let target = ServerTarget.getTarget(this.targetId)

    // If the target is found, set it and update the target status to 'Populated'.
    if (target) {
      this._target = target
      this._targetStatus = 'Populated'
    } else {
      // Set the target status to 'Error'.
      this._targetStatus = 'Error'
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
      // Stores the status of all the argument's dependencies.
      let areDependenciesMet: boolean[] = []

      // If the argument has no dependencies, then the dependencies are met.
      if (!arg.dependencies || arg.dependencies.length === 0) {
        areDependenciesMet = [true]
      }
      // Otherwise, check if the dependencies are met.
      else {
        arg.dependencies.forEach((dependency) => {
          // Grab the dependency argument.
          let dependencyArg: TTargetArg | undefined = target.args.find(
            (arg: TTargetArg) => arg._id === dependency.dependentId,
          )

          // If the dependency argument is found and the dependency
          // is not FORCE or NODE, then check if the dependency is met.
          if (
            dependencyArg &&
            dependency.name !== 'FORCE' &&
            dependency.name !== 'NODE'
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

      // Check to see if all the dependencies are met.
      let allDependenciesMet: boolean = !areDependenciesMet.includes(false)

      // If all the dependencies are met and the argument is not in the effect's arguments...
      if (allDependenciesMet && !(arg._id in effectArgs)) {
        // ...and the argument's type is a boolean, then return the argument.
        // *** Note: A boolean argument is always required because it's value
        // *** is always defined.
        if (arg.type === 'boolean') {
          return arg
        }

        // Otherwise, if the argument is required, then return the argument.
        if (arg.required) {
          return arg
        }
      }
    }
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
