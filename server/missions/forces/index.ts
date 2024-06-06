import { MissionForce } from 'metis/missions/forces'
import { TMissionNodeJson, TMissionNodeOptions } from 'metis/missions/nodes'
import { TServerMissionTypes } from '..'
import ServerMissionNode from '../nodes'

/**
 * Class for managing mission prototypes on the client.
 */
export default class ServerMissionForce extends MissionForce<TServerMissionTypes> {
  // public constructor(
  //   mission: ClientMission,
  //   data: Partial<TCommonMissionForceJson> = MissionForce.DEFAULT_PROPERTIES,
  //   options: TMissionForceOptions = {},
  // ) {
  //   super(mission, data, options)
  // }

  // Implemented
  protected createRootNode(): ServerMissionNode {
    return new ServerMissionNode(this, ServerMissionForce.ROOT_NODE_PROPERTIES)
  }

  // Implemented
  public spawnNode(
    data: Partial<TMissionNodeJson>,
    options: TMissionNodeOptions,
  ): ServerMissionNode {
    let rootNode: ServerMissionNode = this.rootNode

    // Create new node.
    let node: ServerMissionNode = new ServerMissionNode(this, data, options)

    // Add the node to the node map.
    this.nodes.push(node)

    // todo: Determine if this is needed.
    // Handle structure change.
    // this.handleStructureChange()

    // Return the node.
    return node
  }
}
