import { MissionForce, TMissionForceOptions } from 'metis/missions/forces'
import { TMissionNodeJson, TMissionNodeOptions } from 'metis/missions/nodes'
import { TTargetEnvContextForce } from 'metis/server/target-environments/context-provider'
import { TServerMissionTypes } from '..'
import ServerMissionNode from '../nodes'
import { TServerOutput } from './output'

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

  /**
   * Extracts the necessary properties from the force to be used as a reference
   * in a target environment.
   * @returns The force's necessary properties.
   */
  public toTargetEnvContext(): TTargetEnvContextForce {
    return {
      _id: this._id,
      name: this.name,
      nodes: this.nodes.map((node) => node.toTargetEnvContext()),
    }
  }

  // Implemented
  public sendOutput(output: TServerOutput): void {
    this._outputs.push(output)
  }
}

/* ------------------------------ SERVER FORCE TYPES ------------------------------ */

/**
 * Options for creating a ServerMissionForce object.
 */
export type TServerMissionForceOptions = TMissionForceOptions & {}
