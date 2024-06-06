import { TClientMissionTypes } from '..'
import { MissionForce } from '../../../../shared/missions/forces'
import {
  TMissionNodeJson,
  TMissionNodeOptions,
} from '../../../../shared/missions/nodes'
import ClientMissionNode from '../nodes'

/**
 * Class for managing mission prototypes on the client.
 */
export default class ClientMissionForce extends MissionForce<TClientMissionTypes> {
  // public constructor(
  //   mission: ClientMission,
  //   data: Partial<TCommonMissionForceJson> = MissionForce.DEFAULT_PROPERTIES,
  //   options: TMissionForceOptions = {},
  // ) {
  //   super(mission, data, options)
  // }

  // Implemented
  protected createRootNode(): ClientMissionNode {
    return new ClientMissionNode(this, ClientMissionForce.ROOT_NODE_PROPERTIES)
  }

  // Implemented
  public spawnNode(
    data: Partial<TMissionNodeJson>,
    options: TMissionNodeOptions = {},
  ): ClientMissionNode {
    // Create new node.
    let node: ClientMissionNode = new ClientMissionNode(this, data, options)

    // Add the node to the node map.
    this.nodes.push(node)

    // todo: Determine if this is needed.
    // Handle structure change.
    // this.handleStructureChange()

    // Return the node.
    return node
  }
}
