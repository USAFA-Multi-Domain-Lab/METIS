import { ClientTargetEnvironment } from 'src/target-environments'
import { TClientMissionTypes } from '..'
import InternalEffect from '../../../../shared/missions/effects/internal'
import TargetEnvironment from '../../../../shared/target-environments'

/**
 * Class representing an external effect on the client-side that can be
 * applied to a target.
 */
export class ClientInternalEffect extends InternalEffect<TClientMissionTypes> {
  // Implemented
  public async populateTargetData(targetId: string): Promise<void> {
    // Create the internal (METIS) target environment.
    let targetEnv = new ClientTargetEnvironment(
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
    // Try to get a node using the targetParamsId.
    let node = this.mission.getNode(targetParamsId)
    // Try to get a force using the targetParamsId.
    let force = this.mission.getForce(targetParamsId)

    // If a node is found, then the targetParams is a mission-node.
    if (node) {
      this._targetParams = node
    }

    // If a force is found, then the targetParams is a mission-force.
    if (force) {
      this._targetParams = force
    }
  }
}
