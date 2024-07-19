import Mission from 'metis/missions'
import MissionAction from 'metis/missions/actions'
import Effect from 'metis/missions/effects'
import { MissionForce } from 'metis/missions/forces'
import MissionNode from 'metis/missions/nodes'
import ServerEffect from 'metis/server/missions/effects'
import SessionServer from 'metis/server/sessions'
import ServerMission from '../missions'

/**
 * The API for the target environment.
 */
export default class TargetEnvApi implements TCommonTargetEnvApi {
  // Implemented
  public session: SessionServer

  // Implemented
  public get mission(): ServerMission {
    return this.session.mission
  }

  /**
   * Creates a new Target Environment API Object.
   * @param session The server instance for the session that's in progress within METIS.
   */
  public constructor(session: SessionServer) {
    this.session = session
  }

  /**
   * Creates a new context used for applying an effect to its target.
   * @param effect The effect that is applied to its target.
   * @returns The context for the target environment.
   */
  private buildContext(effect: ServerEffect): TTargetEnvContext {
    return {
      effect: effect.toTargetEnvContext(),
      mission: this.mission.toTargetEnvContext(),
      sendOutputMessage: this.sendOutputMessage,
      blockNode: this.blockNode,
      unblockNode: this.unblockNode,
      modifySuccessChance: this.modifySuccessChance,
      modifyProcessTime: this.modifyProcessTime,
      modifyResourceCost: this.modifyResourceCost,
    }
  }

  // Implemented
  public async applyEffect(effect: ServerEffect): Promise<void> {
    // If the effect doesn't have a target environment,
    // log an error.
    if (effect.targetEnvironment === null) {
      throw new Error(
        `The node - "${effect.node.name}" - has an action - "${effect.action.name}" - with an effect - "${effect.name}" - that doesn't have a target environment or the target environment doesn't exist.`,
      )
    }
    // If the effect doesn't have a target,
    // log an error.
    if (effect.target === null) {
      throw new Error(
        `The node - "${effect.node.name}" - has an action - "${effect.action.name}" - with an effect - "${effect.name}" - that doesn't have a target or the target doesn't exist.`,
      )
    }

    // Create a new context for the target environment.
    const context: TTargetEnvContext = this.buildContext(effect)

    try {
      // Execute the effect.
      await effect.target.script(context)
    } catch (error: any) {
      throw new Error(error.message)
    }
  }

  /**
   * Sends the message to the output panel within a session.
   * @param forceId The ID of the force with the output panel to send the message to.
   * @param message The message to output.
   */
  private sendOutputMessage = (forceId: string, message: string) => {}

  /**
   * Blocks the node from being interacted with.
   * @param nodeId The ID of the node to block.
   * @param forceId The ID of the force where the node is located.
   */
  private blockNode = (nodeId: string, forceId: string) => {
    this.session.handleBlockNode(nodeId, forceId, true)
  }

  /**
   * Unblocks the node allowing it to be interacted with.
   * @param nodeId The ID of the node to unblock.
   * @param forceId The ID of the force where the node is located.
   */
  private unblockNode = (nodeId: string, forceId: string) => {
    this.session.handleBlockNode(nodeId, forceId, false)
  }

  /**
   * Modifies an action's chance of success.
   * @param nodeId The ID of the node to modify.
   * @param forceId The ID of the force where the node is located.
   * @param operand The number used to modify the chance of success.
   * @note **ENSURE THE `operand` IS A DECIMAL BETWEEN -1 AND 1. IF NOT, THE EFFECT WILL NOT BE APPLIED.**
   * @note This will modify the chance of success for all actions within the node.
   * @note The operand can be positive or negative. It will either increase or decrease the chance of success.
   */
  private modifySuccessChance = (
    nodeId: string,
    forceId: string,
    operand: number,
  ) => {
    this.session.modifySuccessChance(nodeId, forceId, operand)
  }

  /**
   * Modifies an action's process time.
   * @param nodeId The ID of the node to modify.
   * @param forceId The ID of the force where the node is located.
   * @param operand The number used to modify the process time. |
   * @note **ENSURE THE `operand` IS A WHOLE NUMBER BETWEEN -3,600,000 AND 3,600,000. IF NOT, THE EFFECT WILL NOT BE APPLIED.**
   * @note This will modify the process time for all actions within the node.
   * @note The operand can be positive or negative. It will either increase or decrease the process time.
   */
  private modifyProcessTime = (
    nodeId: string,
    forceId: string,
    operand: number,
  ) => {
    this.session.modifyProcessTime(nodeId, forceId, operand)
  }

  /**
   * Modifies an action's resource cost.
   * @param nodeId The ID of the node to modify.
   * @param forceId The ID of the force where the node is located.
   * @param operand The number used to modify the resource cost.
   * @note This will modify the resource cost for all actions within the node.
   * @note The operand can be positive or negative. It will either increase or decrease the resource cost.
   */
  private modifyResourceCost = (
    nodeId: string,
    forceId: string,
    operand: number,
  ) => {
    this.session.modifyResourceCost(nodeId, forceId, operand)
  }
}

/* ------------------------------ TARGET ENVIRONMENT API TYPES ------------------------------ */

/**
 * Object representing the API for the target environment.
 */
type TCommonTargetEnvApi = {
  /**
   * The server instance for the session that's in progress within METIS.
   */
  session: SessionServer
  /**
   * The mission for the session that's in progress within METIS.
   */
  get mission(): Mission
  /**
   * Applies the effect to its target.
   * @param effect The effect to apply to the target.
   */
  applyEffect: (effect: ServerEffect) => Promise<void>
}

/**
 * Object representing the context for the target environment.
 */
export type TTargetEnvContext = {
  /**
   * A effect that is applied to its target.
   */
  readonly effect: TTargetEnvContextEffect
  /**
   * The context of the mission for the target environment.
   */
  readonly mission: TTargetEnvContextMission
  /**
   * Sends the message to the output panel within a session.
   * @param forceId The ID of the force with the output panel to send the message to.
   * @param message The message to output.
   */
  sendOutputMessage: (forceId: string, message: string) => void
  /**
   * Blocks the node from being interacted with.
   * @param nodeId The ID of the node to block.
   * @param forceId The ID of the force where the node is located.
   */
  blockNode: (nodeId: string, forceId: string) => void
  /**
   * Unblocks the node allowing it to be interacted with.
   * @param nodeId The ID of the node to unblock.
   * @param forceId The ID of the force where the node is located.
   */
  unblockNode: (nodeId: string, forceId: string) => void
  /**
   * Modifies an action's chance of success.
   * @param nodeId The ID of the node to modify.
   * @param forceId The ID of the force where the node is located.
   * @param operand The number used to modify the chance of success.
   * @note **ENSURE THE `operand` IS A DECIMAL BETWEEN -1 AND 1. IF NOT, THE EFFECT WILL NOT BE APPLIED.**
   * @note This will modify the chance of success for all actions within the node.
   * @note The operand can be positive or negative. It will either increase or decrease the chance of success.
   */
  modifySuccessChance: (
    nodeId: string,
    forceId: string,
    operand: number,
  ) => void
  /**
   * Modifies an action's process time.
   * @param nodeId The ID of the node to modify.
   * @param forceId The ID of the force where the node is located.
   * @param operand The number used to modify the process time. |
   * @note **ENSURE THE `operand` IS A WHOLE NUMBER BETWEEN -3,600,000 AND 3,600,000. IF NOT, THE EFFECT WILL NOT BE APPLIED.**
   * @note This will modify the process time for all actions within the node.
   * @note The operand can be positive or negative. It will either increase or decrease the process time.
   */
  modifyProcessTime: (nodeId: string, forceId: string, operand: number) => void
  /**
   * Modifies an action's resource cost.
   * @param nodeId The ID of the node to modify.
   * @param forceId The ID of the force where the node is located.
   * @param operand The number used to modify the resource cost.
   * @note This will modify the resource cost for all actions within the node.
   * @note The operand can be positive or negative. It will either increase or decrease the resource cost.
   */
  modifyResourceCost: (nodeId: string, forceId: string, operand: number) => void
}

/**
 * The context of the mission for the target environment.
 */
export type TTargetEnvContextMission = {
  /**
   * The ID for the mission.
   */
  readonly _id: Mission['_id']
  /**
   * The name for the mission.
   */
  readonly name: Mission['name']
  /**
   * All forces that exist in the mission.
   */
  get forces(): TTargetEnvContextForce[]
  /**
   * All nodes that exist in the mission.
   */
  get nodes(): TTargetEnvContextNode[]
}

/**
 * The context of the force for the target environment.
 */
export type TTargetEnvContextForce = {
  /**
   * The ID for the force.
   */
  readonly _id: MissionForce['_id']
  /**
   * The name for the force.
   */
  readonly name: MissionForce['name']
  /**
   * All nodes that exist in the force.
   */
  readonly nodes: TTargetEnvContextNode[]
}

/**
 * The context of the node for the target environment.
 */
export type TTargetEnvContextNode = {
  /**
   * The ID for the node.
   */
  readonly _id: MissionNode['_id']
  /**
   * The name for the node.
   */
  readonly name: MissionNode['name']
  /**
   * The description for the node.
   */
  readonly description: MissionNode['description']
  /**
   * The actions for the node.
   */
  readonly actions: TTargetEnvContextAction[]
}

/**
 * The context of the action for the target environment.
 */
export type TTargetEnvContextAction = {
  /**
   * The ID for the action.
   */
  readonly _id: MissionAction['_id']
  /**
   * The name for the action.
   */
  readonly name: MissionAction['name']
  /**
   * The description for the action.
   */
  readonly description: MissionAction['description']
  /**
   * The chance that the action will succeed.
   */
  readonly successChance: MissionAction['successChance']
  /**
   * The amount of time it takes to execute the action.
   */
  readonly processTime: MissionAction['processTime']
  /**
   * The amount of resources the action will be subtracted from that available to the executor of the action.
   */
  readonly resourceCost: MissionAction['resourceCost']
  /**
   * All effects that exist in the action.
   */
  readonly effects: TTargetEnvContextEffect[]
}

/**
 * The context of the effect for the target environment.
 */
export type TTargetEnvContextEffect = {
  /**
   * The ID for the effect.
   */
  readonly _id: Effect['_id']
  /**
   * The name for the effect.
   */
  readonly name: Effect['name']
  /**
   * The arguments used to affect the target.
   */
  readonly args: Effect['args']
}
