import Effect, {
  TCommonEffectJson,
  TEffectOptions,
} from 'metis/missions/effects'
import ServerTargetEnvironment from 'metis/server/target-environments'
import { TTargetEnvContextEffect } from 'metis/server/target-environments/context-provider'
import ServerTarget from 'metis/server/target-environments/targets'
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
  // Implemented
  public get targetEnvironment(): ServerTargetEnvironment | null {
    if (this.target instanceof ServerTarget) {
      return this.target.targetEnvironment
    } else {
      return null
    }
  }

  /**
   * Class representing an effect on the server-side that can be
   * applied to a target.
   * @param action The action to which the effect belongs.
   * @param data The data for the effect.
   * @param options The options for the effect.
   */
  public constructor(
    action: ServerMissionAction,
    data: Partial<TCommonEffectJson> = ServerEffect.DEFAULT_PROPERTIES,
    options: TServerEffectOptions = {},
  ) {
    super(action, data, options)

    // If the target data has been provided and
    // it's not the default target ID, then populate
    // the target data.
    if (data.targetId) {
      this.populateTargetData(data.targetId)
    }
  }

  // Implemented
  public async populateTargetData(targetId: string): Promise<void> {
    // Get the target from the target environment.
    let target = ServerTarget.getTarget(targetId)

    // If the target is found, set it.
    if (target) {
      this._target = target
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
}

/* ------------------------------ SERVER EFFECT TYPES ------------------------------ */

/**
 * The options for creating a ServerEffect.
 */
export type TServerEffectOptions = TEffectOptions & {}
