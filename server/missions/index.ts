import Mission, {
  IMissionJSON,
  ISpawnNodeOptions,
  TMissionOptions,
} from 'metis/missions'
import MissionNodeServer from './nodes'
import { IMissionNodeJSON } from 'metis/missions/nodes'
import seedrandom, { PRNG } from 'seedrandom'

/**
 * Class for managing missions on the server.
 */
export default class MissionServer extends Mission<MissionNodeServer> {
  /**
   * The RNG used to generate random numbers for the mission.
   */
  public rng: PRNG

  public constructor(
    data: Partial<IMissionJSON> = Mission.DEFAULT_PROPERTIES,
    options: TMissionOptions = {},
  ) {
    super(data, options)
    this.rng = seedrandom(`${data.seed}`)
  }

  // Inherited
  public spawnNode(
    data?: Partial<IMissionNodeJSON> | undefined,
    options?: ISpawnNodeOptions<MissionNodeServer> | undefined,
  ): MissionNodeServer {
    let rootNode: MissionNodeServer | null = this.rootNode

    // If the mission has no root node, throw an error.
    if (rootNode === null) {
      throw new Error('Cannot spawn node: Mission has no root node.')
    }

    // Create new node.
    let node: MissionNodeServer = new MissionNodeServer(this, data, options)

    // Set the parent node to the root
    // node.
    node.parentNode = rootNode

    // Add the node to the root node's
    // children.
    rootNode.childNodes.push(node)

    // Return the node.
    return node
  }
}
