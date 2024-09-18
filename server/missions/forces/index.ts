import {
  MissionForce,
  TMissionForceJson,
  TMissionForceOptions,
} from 'metis/missions/forces'
import { TMissionNodeJson, TMissionNodeOptions } from 'metis/missions/nodes'
import { TTargetEnvContextForce } from 'metis/server/target-environments/context-provider'
import ServerMission, { TServerMissionTypes } from '..'
import ServerMissionNode from '../nodes'
import { ServerOutput } from './outputs'
import ServerIntroOutput from './outputs/intro'

/**
 * Class for managing mission prototypes on the client.
 */
export default class ServerMissionForce extends MissionForce<TServerMissionTypes> {
  /**
   * @param mission The mission to which the force belongs.
   * @param data The force data from which to create the force. Any ommitted
   * values will be set to the default properties defined in
   * MissionForce.DEFAULT_PROPERTIES.
   * @param options The options for creating the force.
   */
  public constructor(
    mission: ServerMission,
    data: Partial<TMissionForceJson> = MissionForce.DEFAULT_PROPERTIES,
    options: TServerMissionForceOptions = {},
  ) {
    super(mission, data, options)

    // Parse options.
    let { sendIntroMessage = false } = options

    // Send the intro message if the flag is set.
    if (sendIntroMessage) this.sendIntroMessage()
  }

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
  public storeOutput(output: ServerOutput): void {
    // Add the output to the force's output list.
    this._outputs.push(output)
    // Sort the outputs by time.
    this._outputs.sort((a, b) => a.time - b.time)
  }

  /**
   * Sends the intro message to the force's output panel.
   */
  private sendIntroMessage(): void {
    this.storeOutput(new ServerIntroOutput(this.mission, this))
  }
}

/* ------------------------------ SERVER FORCE TYPES ------------------------------ */

/**
 * Options for creating a ServerMissionForce object.
 */
export type TServerMissionForceOptions = TMissionForceOptions & {
  /**
   * Whether to send the intro message to the output panel.
   */
  sendIntroMessage?: boolean
}
