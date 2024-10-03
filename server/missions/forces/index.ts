import {
  MissionForce,
  TMissionForceJson,
  TMissionForceOptions,
} from 'metis/missions/forces'
import { TCommonOutputJson } from 'metis/missions/forces/output'
import { TMissionNodeJson, TMissionNodeOptions } from 'metis/missions/nodes'
import { TTargetEnvContextForce } from 'metis/server/target-environments/context-provider'
import ServerUser from 'metis/server/users'
import ServerMission, { TServerMissionTypes } from '..'
import ServerMissionNode from '../nodes'
import ServerOutput from './output'

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
    let index = this.findInsertionIndex(output)
    this._outputs.splice(index, 0, output)
  }

  /**
   * Sends the intro message to the force's output panel.
   */
  public sendIntroMessage(): void {
    // Send the intro message if it exists and isn't an empty string.
    if (!!this.introMessage) {
      // Create the output JSON.
      let outputJson: Partial<TCommonOutputJson> = {
        key: 'intro',
        forceId: this._id,
        prefix: `${this.name.replaceAll(' ', '-')}:`,
        message: this.introMessage,
      }
      // Create the output.
      let output = new ServerOutput(this, outputJson)
      // Store the output.
      this.storeOutput(output)
    }
  }

  // Implemented
  protected filterOutputs(userId?: ServerUser['_id']): ServerOutput[] {
    return this.outputs.filter(
      (output) =>
        output.broadcastType === 'force' ||
        (output.broadcastType === 'user' && output.userId === userId),
    )
  }
}

/* ------------------------------ SERVER FORCE TYPES ------------------------------ */

/**
 * Options for creating a ServerMissionForce object.
 */
export type TServerMissionForceOptions = TMissionForceOptions & {}
