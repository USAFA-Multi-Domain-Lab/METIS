import InternalEffect from 'metis/missions/effects/internal'
import ServerTargetEnvironment from 'metis/server/target-environments'
import TargetEnvironment from 'metis/target-environments'
import { TServerMissionTypes } from '..'

/**
 * Class representing an internal effect on the server-side that can be
 * applied to a target.
 */
export default class ServerInternalEffect extends InternalEffect<TServerMissionTypes> {
  // Implemented
  public async populateTargetData(targetId: string): Promise<void> {
    // Create the internal (METIS) target environment.
    let targetEnv = new ServerTargetEnvironment(
      TargetEnvironment.INTERNAL_TARGET_ENV,
    )
    // Get the target from the target environment.
    let target = targetEnv.targets.find((target) => target._id === targetId)
    // If the target is found, set it.
    if (target) {
      this._target = target
    }
  }

  // Implemented
  public async populateTargetParamsData(targetParamsId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Try to get a node using the targetParamsId.
        let node = this.mission.getNode(targetParamsId)
        // Try to get a force using the targetParamsId.
        let force = this.mission.getForce(targetParamsId)

        // If a node is found, then the targetParams is a mission-node.
        if (node) {
          this._targetParams = node
          resolve()
        }

        // If a force is found, then the targetParams is a mission-force.
        if (force) {
          this._targetParams = force
          resolve()
        }

        reject('Failed to populate target params data.')
      } catch (error: any) {
        console.error(`Failed to populate target params data:\n`, error)
        reject('Failed to populate target params data.')
      }
    })
  }
}
