import Mission from 'metis/missions'
import { TMissionNodeJson, TMissionNodeOptions } from 'metis/missions/nodes'
import { TMissionPrototypeOptions } from 'metis/missions/nodes/prototypes'
import seedrandom, { PRNG } from 'seedrandom'
import ServerMissionNode from './nodes'
import ServerMissionPrototype from './nodes/prototypes'

/**
 * Class for managing missions on the server.
 */
export default class ServerMission extends Mission<
  ServerMissionPrototype,
  ServerMissionNode
> {
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

  // Implemented
  protected createRootNode(): ServerMissionNode {
    return new ServerMissionNode(this, Mission.ROOT_NODE_PROPERTIES)
  }

  // Implemented
  protected createRootPrototype(): ServerMissionPrototype {
    return new ServerMissionPrototype(this, 'ROOT')
  }

  // Implemented
  public spawnNode(
    data: Partial<TMissionNodeJson> = {},
    options: TMissionNodeOptions<ServerMissionNode> = {},
  ): ServerMissionNode {
    let rootNode: ServerMissionNode | null = this.rootNode

    // If the mission has no root node, throw an error.
    if (rootNode === null) {
      throw new Error('Cannot spawn node: Mission has no root node.')
    }

    // Create new node.
    let node: ServerMissionNode = new ServerMissionNode(this, data, options)

    // Set the parent node to the root
    // node.
    node.parentNode = rootNode
    // Add the node to the root node's
    // children.
    rootNode.childNodes.push(node)
    // Add the node to the node map.
    this.nodes.push(node)

    // Return the node.
    return node
  }

  // Implemented
  public spawnPrototype(
    _id: string,
    options: TMissionPrototypeOptions<ServerMissionPrototype> = {},
  ): ServerMissionPrototype {
    let rootPrototype: ServerMissionPrototype | null = this.rootPrototype

    // If the mission has no root prototype, throw an error.
    if (rootPrototype === null) {
      throw new Error('Cannot spawn prototype: Mission has no root prototype.')
    }

    // Create new prototype.
    let prototype: ServerMissionPrototype = new ServerMissionPrototype(
      this,
      _id,
      options,
    )

    // Set the parent prototype to the root
    // prototype.
    prototype.parentNode = rootPrototype
    // Add the prototype to the root prototype's
    // children.
    rootPrototype.children.push(prototype)
    // Add the prototype to the prototype list.
    this.prototypes.push(prototype)

    // Return the prototype.
    return prototype
  }
}
