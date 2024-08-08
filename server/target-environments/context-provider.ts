import ServerEffect from 'metis/server/missions/effects'
import SessionServer from 'metis/server/sessions'
import { AnyObject } from 'metis/toolbox/objects'
import { plcApiLogger } from '../logging'
import ServerMission from '../missions'

/**
 * The context provider for the target environment.
 */
export default class EnvironmentContextProvider
  implements TCommonEnvContextProvider
{
  // Implemented
  public session: SessionServer

  // Implemented
  public get mission(): ServerMission {
    return this.session.mission
  }

  /**
   * Creates a new EnvironmentContextProvider Object.
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
        `The force - "${effect.force.name}" - has a node - "${effect.node.name}" - has an action - "${effect.action.name}" - with an effect - "${effect.name}" - that doesn't have a target environment or the target environment doesn't exist.`,
      )
    }
    // If the effect doesn't have a target,
    // log an error.
    if (effect.target === null) {
      throw new Error(
        `The force - "${effect.force.name}" - has a node - "${effect.node.name}" - has an action - "${effect.action.name}" - with an effect - "${effect.name}" - that doesn't have a target or the target doesn't exist.`,
      )
    }

    // Create a new context for the target environment.
    const context = this.buildContext(effect)

    try {
      // If the effect's target has not been populated,
      // populate the target data.
      if (effect.targetStatus === 'Not Populated') {
        effect.populateTargetData()
      }
      // Apply the effect to the target.
      await effect.target.script(context)
    } catch (error: any) {
      // Give additional information about the error.
      let message =
        `Failed to apply effect - "${effect.name}" - to target - "${effect.target.name} found in the environment - "${effect.targetEnvironment.name}".\n` +
        `The effect - "${effect.name}" - can be found here:\n` +
        `force - "${effect.force.name}" - node - "${effect.node.name}" - action - "${effect.action.name}" - effect - "${effect.name}".\n`
      // Log the error.
      plcApiLogger.error(message, error)
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
    this.session.updateNodeBlockStatus(nodeId, forceId, true)
  }

  /**
   * Unblocks the node allowing it to be interacted with.
   * @param nodeId The ID of the node to unblock.
   * @param forceId The ID of the force where the node is located.
   */
  private unblockNode = (nodeId: string, forceId: string) => {
    this.session.updateNodeBlockStatus(nodeId, forceId, false)
  }

  /**
   * Modifies an action's chance of success.
   * @param nodeId The ID of the node to modify.
   * @param forceId The ID of the force where the node is located.
   * @param operand The number used to modify the chance of success.
   * @note **If the result is less than 0%, the chance of success will be set to 0%.**
   * @note **If the result is greater than 100%, the chance of success will be set to 100%.**
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
   * @param operand The number used to modify the process time.
   * @note **If the result is less than 0, the process time will be set to 0.**
   * @note **If the result is greater than 1 hour (3,600,000 milliseconds), the process time will be set to 1 hour.**
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
   * @note **If the result is less than 0, the resource cost will be set to 0.**
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

/* ------------------------------ ENVIRONMENT CONTEXT PROVIDER TYPES ------------------------------ */

/**
 * Object representing the context provider for the target environment.
 */
type TCommonEnvContextProvider = {
  /**
   * The server instance for the session that's in progress within METIS.
   */
  session: SessionServer
  /**
   * The mission for the session that's in progress within METIS.
   */
  get mission(): ServerMission
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
   * @note **If the result is less than 0%, the chance of success will be set to 0%.**
   * @note **If the result is greater than 100%, the chance of success will be set to 100%.**
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
   * @param operand The number used to modify the process time.
   * @note **If the result is less than 0, the process time will be set to 0.**
   * @note **If the result is greater than 1 hour (3,600,000 milliseconds), the process time will be set to 1 hour.**
   * @note This will modify the process time for all actions within the node.
   * @note The operand can be positive or negative. It will either increase or decrease the process time.
   */
  modifyProcessTime: (nodeId: string, forceId: string, operand: number) => void
  /**
   * Modifies an action's resource cost.
   * @param nodeId The ID of the node to modify.
   * @param forceId The ID of the force where the node is located.
   * @param operand The number used to modify the resource cost.
   * @note **If the result is less than 0, the resource cost will be set to 0.**
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
  readonly _id: string
  /**
   * The name for the mission.
   */
  readonly name: string
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
  readonly _id: string
  /**
   * The name for the force.
   */
  readonly name: string
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
  readonly _id: string
  /**
   * The name for the node.
   */
  readonly name: string
  /**
   * The description for the node.
   */
  readonly description: string
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
  readonly _id: string
  /**
   * The name for the action.
   */
  readonly name: string
  /**
   * The description for the action.
   */
  readonly description: string
  /**
   * The chance that the action will succeed.
   */
  readonly successChance: number
  /**
   * The amount of time it takes to execute the action.
   */
  readonly processTime: number
  /**
   * The amount of resources the action will be subtracted from that available to the executor of the action.
   */
  readonly resourceCost: number
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
  readonly _id: string
  /**
   * The name for the effect.
   */
  readonly name: string
  /**
   * The arguments used to affect the target.
   */
  readonly args: AnyObject
}
