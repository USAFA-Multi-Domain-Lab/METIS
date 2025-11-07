import { generateValidationError } from '@server/database/validation'
import type { TTargetEnvExposedForce } from '@server/target-environments/TargetEnvContext'
import type {
  TMissionForceJson,
  TMissionForceSaveJson,
} from '@shared/missions/forces/MissionForce'
import { MissionForce } from '@shared/missions/forces/MissionForce'
import type { TMissionNodeJson } from '@shared/missions/nodes/MissionNode'
import { NumberToolbox } from '@shared/toolbox/numbers/NumberToolbox'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import { ServerMissionNode } from '../nodes/ServerMissionNode'
import type { ServerMission } from '../ServerMission'
import { ServerOutput } from './ServerOutput'

/**
 * Class for managing mission forces on the server.
 */
export class ServerMissionForce extends MissionForce<TMetisServerComponents> {
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
  ) {
    super(mission, data)
  }

  // Implemented
  public createNode(data: Partial<TMissionNodeJson>): ServerMissionNode {
    return new ServerMissionNode(this, data)
  }

  // Implemented
  public spawnNode(data: Partial<TMissionNodeJson>): ServerMissionNode {
    let root: ServerMissionNode = this.root

    // Create new node.
    let node: ServerMissionNode = new ServerMissionNode(this, data)

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
    this.nodes = this.nodes.map((node) => {
      if (node.exclude) return node.toGhost()
      return node
    })
  }

  // Implemented
  public filterOutputs(memberId?: string): ServerOutput[] {
    if (!memberId) return this.outputs
    return this.outputs.filter((output) => {
      return !output.memberId || output.memberId === memberId
    })
  }

  // Implemented
  public modifyResourcePool(operand: number): void {
    if (!NumberToolbox.isNonNegative(operand)) {
      throw new Error('The operand must be a positive number.')
    }
    this.resourcesRemaining += operand
  }

  /**
   * Validates the nodes of the force.
   * @param nodes The nodes to validate.
   * @returns True if the nodes are valid, false otherwise.
   */
  public static validateNodes(nodes: TMissionForceSaveJson['nodes']): void {
    let nodeKeys: TMissionNodeJson['localKey'][] = []

    // Make sure the nodes are not empty.
    if (nodes.length < this.NODE_DATA_MIN_LENGTH) {
      throw generateValidationError(
        `There must be at least ${this.NODE_DATA_MIN_LENGTH} node(s) within the force.`,
      )
    }

    for (let node of nodes) {
      // If the node is executable, it must have at least one action.
      if (
        node.executable &&
        node.actions.length < ServerMissionNode.ACTIONS_MIN_LENGTH
      ) {
        throw generateValidationError(
          `The node "{ _id: ${node._id}, name: ${node.name} }" must have at least ${ServerMissionNode.ACTIONS_MIN_LENGTH} action(s).`,
        )
      }

      // Make sure the node's color is a valid hex color.
      let isValidColor = StringToolbox.HEX_COLOR_REGEX.test(node.color)
      if (!isValidColor) {
        throw generateValidationError(
          `The node "{ _id: ${node._id}, name: ${node.name} }" has an invalid color "${node.color}".`,
        )
      }

      // Make sure the node's local key is unique within the force.
      if (nodeKeys.includes(node.localKey)) {
        throw generateValidationError(
          `The node "{ _id: ${node._id}, name: ${node.name} }" has a duplicate local key "${node.localKey}".`,
        )
      }
      nodeKeys.push(node.localKey)
    }
  }

  /**
   * The minimum length of the node data.
   * @note This is used to validate the nodes of the force.
   * @see {@link validateNodes}
   */
  private static readonly NODE_DATA_MIN_LENGTH = 1
}
