import Effect from 'metis/missions/effects'
import ServerTargetEnvironment from 'metis/server/target-environments'
import { TTargetEnvContextEffect } from 'metis/server/target-environments/context-provider'
import ServerTarget from 'metis/server/target-environments/targets'
import { TServerMissionTypes } from '..'

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
   * Extracts the necessary properties from the effect to be used as a reference
   * in a target environment.
   * @returns The effect's necessary properties.
   */
  public toTargetEnvContext(): TTargetEnvContextEffect {
    return {
      _id: this._id,
      name: this.name,
      args: this.args,
    }
  }
}
