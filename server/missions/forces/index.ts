import { MissionForce } from 'metis/missions/forces'
import { TMissionNodeJson, TMissionNodeOptions } from 'metis/missions/nodes'
import { TServerMissionTypes } from '..'
import ServerMissionNode from '../nodes'

/**
 * Class for managing mission prototypes on the client.
 */
export default class ServerMissionForce extends MissionForce<TServerMissionTypes> {
  // Implemented
  public createNode(
    data: Partial<TMissionNodeJson>,
    options: TMissionNodeOptions = {},
  ): ServerMissionNode {
    return new ServerMissionNode(this, data, options)
  }

  // Implemented
  public spawnNode(
    data: Partial<TMissionNodeJson>,
    options: TMissionNodeOptions,
  ): ServerMissionNode {
    let root: ServerMissionNode = this.root

    // Create new node.
    let node: ServerMissionNode = new ServerMissionNode(this, data, options)

    // Add the node to the node map.
    this.nodes.push(node)

    // Return the node.
    return node
  }
}
