import InternalEffect, {
  TInternalTarget,
} from 'metis/missions/effects/internal'
import ServerMissionAction from '../actions'
import ServerMissionNode from '../nodes'

/**
 * Class representing an internal effect on the server-side that can be
 * applied to a target.
 */
export default class ServerInternalEffect extends InternalEffect<ServerMissionAction> {
  // Implemented
  public async populateTargetData(target: TInternalTarget): Promise<void> {
    // If the target's key is 'node' and the target's node is a string,
    // that means the target is a node ID, so we need to get the node.
    if (
      target.key === 'node' &&
      !(target.node instanceof ServerMissionNode) &&
      typeof target.node === 'string'
    ) {
      // Get the node from the mission.
      let node: ServerMissionNode | undefined = this.mission.getNode(
        target.node,
      )

      // If the node is found, set it.
      if (node) {
        target.node = node
      }
    }
    // If the target's key is 'output' and the target's force is a string,
    // that means the target is a force ID, so we need to get the force.
    // else if (target.key === 'output' && !(target.force instanceof Force) && typeof target.force === 'string') {
    // target.force =
    // }
  }
}
