import Mission, { ISpawnNodeOptions } from 'metis/missions'
import ServerMissionNode from './nodes'
import { TMissionNodeJSON } from 'metis/missions/nodes'
import seedrandom, { PRNG } from 'seedrandom'

/**
 * Class for managing missions on the server.
 */
export default class ServerMission extends Mission<ServerMissionNode> {
  /**
   * The RNG used to generate random numbers for the mission.
   */
  protected _rng: PRNG | undefined
  /**
   * The RNG used to generate random numbers for the mission.
   */
  public get rng(): PRNG {
    // Initialize RNG if not done already. This
    // cannot be done in the constructor due to
    // this value being needed in the super call.
    if (this._rng === undefined) {
      this._rng = seedrandom(`${this.seed}`)
    }
    return this._rng
  }

  // Inherited
  protected createRootNode(): ServerMissionNode {
    return new ServerMissionNode(this, Mission.ROOT_NODE_PROPERTIES)
  }

  // Inherited
  public spawnNode(
    data: Partial<TMissionNodeJSON> = {},
    options: ISpawnNodeOptions<ServerMissionNode> = {},
  ): ServerMissionNode {
    let { addToNodeMap = true, makeChildOfRoot = true } = options
    let rootNode: ServerMissionNode | null = this.rootNode

    // If the mission has no root node, throw an error.
    if (rootNode === null) {
      throw new Error('Cannot spawn node: Mission has no root node.')
    }

    // Create new node.
    let node: ServerMissionNode = new ServerMissionNode(this, data, options)

    // Handle makeChildOfRoot option.
    if (makeChildOfRoot) {
      // Set the parent node to the root
      // node.
      node.parentNode = rootNode
      // Add the node to the root node's
      // children.
      rootNode.childNodes.push(node)
    }
    // Handle addToNodeMap option.
    if (addToNodeMap) {
      // Add the node to the node map.
      this.nodes.set(node.nodeID, node)
    }

    // Return the node.
    return node
  }
}
