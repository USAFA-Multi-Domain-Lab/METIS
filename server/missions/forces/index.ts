import {
  MissionForce,
  TMissionForceJson,
  TMissionForceOptions,
} from 'metis/missions/forces'
import { TMissionNodeJson, TMissionNodeOptions } from 'metis/missions/nodes'
import { TMetisServerComponents } from 'metis/server'
import { TTargetEnvExposedForce } from 'metis/server/target-environments/context'
import ServerUser from 'metis/server/users'
import ServerMission from '..'
import ServerMissionNode from '../nodes'
import ServerOutput from './output'

/**
 * Class for managing mission forces on the server.
 */
export default class ServerMissionForce extends MissionForce<TMetisServerComponents> {
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
  public toTargetEnvContext(): TTargetEnvExposedForce {
    return {
      _id: this._id,
      name: this.name,
      nodes: this.nodes.map((node) => node.toTargetEnvContext()),
    }
  }

  // Implemented
  public storeOutput(output: ServerOutput): void {
    if (output.force._id !== this._id) {
      throw new Error(
        `Output force ID "${output.force._id}" does not match force ID "${this._id}".`,
      )
    }
    let index = this.findInsertionIndex(output)
    this._outputs.splice(index, 0, output)
  }

  /**
   * Sends the intro message to the force's output panel.
   */
  public sendIntroMessage(): void {
    // Send the intro message if it exists and isn't an empty string.
    if (!!this.introMessage) {
      // Generate new output.
      let output = ServerOutput.generate(
        this,
        `${this.name.replaceAll(' ', '-')}:`,
        this.introMessage,
        { type: 'intro' },
      )
      // Store the output.
      this.storeOutput(output)
    }
  }

  /**
   * Handles the excluded nodes in the force.
   * @note This function is meant to prepare the force and its
   * nodes for a session. In order for the force and its nodes
   * to be ready for a session, the excluded nodes must be taken
   * care of.
   */
  public handleExcludedNodes(): void {
    this.nodes.forEach((node) => {
      if (node.exclude) node.toGhost()
    })
  }

  // Implemented
  public filterOutputs(userId?: ServerUser['_id']): ServerOutput[] {
    return this.outputs.filter(
      (output) =>
        output.broadcastType === 'force' ||
        (output.broadcastType === 'user' && output.userId === userId),
    )
  }

  // Implemented
  public modifyResourcePool(operand: number): void {
    this.resourcesRemaining += operand
  }
}

/* ------------------------------ SERVER FORCE TYPES ------------------------------ */

/**
 * Options for creating a ServerMissionForce object.
 */
export type TServerMissionForceOptions = TMissionForceOptions & {}
