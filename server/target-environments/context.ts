import ServerEffect from 'metis/server/missions/effects'
import ServerMissionNode from 'metis/server/missions/nodes'
import SessionServer from 'metis/server/sessions'
import ServerSessionMember from 'metis/server/sessions/members'
import { AnyObject } from 'metis/toolbox/objects'
import ServerMissionAction from '../missions/actions'
import ServerMissionFile from '../missions/files'
import ServerMissionForce from '../missions/forces'

export default class TargetEnvContext {
  /**
   * The effect for the current context.
   */
  private readonly effect: ServerEffect

  /**
   * The ID of the effect for the current context.
   */
  private get effectId() {
    return this.effect._id
  }

  /**
   * The local key of the effect for the current context.
   */
  private get effectKey() {
    return this.effect.localKey
  }

  /**
   * The action for the current context.
   */
  private get action(): ServerMissionAction {
    return this.effect.action
  }

  /**
   * The ID of the action for the current context.
   */
  private get actionId() {
    return this.action._id
  }

  /**
   * The local key of the action for the current context.
   */
  private get actionKey() {
    return this.action.localKey
  }

  /**
   * The node for the current context.
   */
  private get node(): ServerMissionNode {
    return this.effect.node
  }

  /**
   * The ID of the node for the current context.
   */
  private get nodeId() {
    return this.node._id
  }

  /**
   * The local key of the node for the current context.
   */
  private get nodeKey() {
    return this.node.localKey
  }

  /**
   * The force for the current context.
   */
  private get force(): ServerMissionForce {
    return this.effect.force
  }

  /**
   * The ID of the force for the current context.
   */
  private get forceId() {
    return this.force._id
  }

  /**
   * The local key of the force for the current context.
   */
  private get forceKey() {
    return this.force.localKey
  }

  /**
   * The mission for the current context.
   */
  private get mission() {
    return this.session.mission
  }

  /**
   * The ID of the mission for the current context.
   */
  private get missionId() {
    return this.mission._id
  }

  /**
   * The member of the session that triggered the effect.
   */
  private readonly member: ServerSessionMember

  /**
   * The ID of the member of the session that triggered the effect.
   */
  private get memberId() {
    return this.member._id
  }

  /**
   * The user that triggered the effect.
   */
  private get user() {
    return this.member.user
  }

  /**
   * The ID of the user that triggered the effect.
   */
  private get userId() {
    return this.user._id
  }

  /**
   * The session for the current context.
   */
  private readonly session: SessionServer

  /**
   * The ID of the session for the current context.
   */
  private get sessionId() {
    return this.session._id
  }

  /**
   * @param effect The effect for the current context.
   * @param user The user that triggered the effect.
   * @param session The session for the current context.
   */
  public constructor(
    effect: ServerEffect,
    member: ServerSessionMember,
    session: SessionServer,
  ) {
    this.effect = effect
    this.member = member
    this.session = session
  }

  /**
   * Creates a limited context to expose to the target
   * environment scripts.
   */
  public expose(): TTargetEnvExposedContext {
    return {
      effect: this.effect.toTargetEnvContext(),
      mission: this.mission.toTargetEnvContext(),
      user: this.user.toTargetEnvContext(),
      sendOutput: this.sendOutput,
      blockNode: this.blockNode,
      unblockNode: this.unblockNode,
      modifySuccessChance: this.modifySuccessChance,
      modifyProcessTime: this.modifyProcessTime,
      modifyResourceCost: this.modifyResourceCost,
      modifyResourcePool: this.modifyResourcePool,
      grantFileAccess: this.grantFileAccess,
      revokeFileAccess: this.revokeFileAccess,
    }
  }

  /**
   * Determines the target force.
   * @param forceKey The local key of the force to manipulate.
   * @returns The target force.
   * @throws If a force was specified in the options, but it could
   * not be found.
   */
  private determineTargetForce(
    forceKey: string | 'self' = 'self',
  ): ServerMissionForce {
    const { mission, missionId } = this

    // If the force is set to 'self', return the current force.
    if (forceKey === 'self') return this.force

    // Find the specified force.
    let result = mission.getForceByLocalKey(forceKey)

    if (!result) {
      throw new Error(
        `Could not find force with local key "${forceKey}" in the mission with ID "${missionId}".`,
      )
    }

    return result
  }

  /**
   * Determines the target node.
   * @param forceKey The local key of the force to which the node belongs.
   * @param nodeKey The local key of the node to manipulate.
   * @returns The target node.
   * @throws If a node was specified in the options, but it could
   * not be found.
   */
  private determineTargetNode(
    forceKey: string | 'self' = 'self',
    nodeKey: string | 'self' = 'self',
  ): ServerMissionNode {
    const { mission, missionId } = this

    // If the node wasn't specified, return the
    // current node.
    // todo: Change this to return undefined when
    // todo: we implement the ability to affect all
    // todo: nodes in a force.
    if (!nodeKey) return this.node

    // Handle any keys that are set to 'self'.
    if (nodeKey === 'self') return this.node
    if (forceKey === 'self') forceKey = this.forceKey

    // Find the specified node.
    let result = mission.getNodeByLocalKey(forceKey, nodeKey)

    if (!result) {
      throw new Error(
        `Could not find node with these local keys { forceKey: "${forceKey}", nodeKey: "${nodeKey}" } in the mission with ID "${missionId}".`,
      )
    }

    return result
  }

  /**
   * Determines the target action.
   * @param forceKey The local key of the force to which the action belongs.
   * @param nodeKey The local key of the node to which the action belongs.
   * @param actionKey The local key of the action to manipulate.
   * @returns The target action.
   * @throws If an action was specified in the options, but it could
   * not be found or the action is not an instance of `ServerMissionAction`.
   */
  private determineTargetAction(
    forceKey: string | 'self' = 'self',
    nodeKey: string | 'self' = 'self',
    actionKey: string | 'self' | 'all' = 'all',
  ): ServerMissionAction | undefined {
    const { mission, missionId } = this

    // If the action is set to 'all', return undefined.
    if (actionKey === 'all') return undefined

    // Handle any keys that are set to 'self'.
    if (actionKey === 'self') return this.action
    if (nodeKey === 'self') nodeKey = this.nodeKey
    if (forceKey === 'self') forceKey = this.forceKey

    // Find the specified action.
    const result = mission.getActionByLocalKey(forceKey, nodeKey, actionKey)

    if (!result) {
      throw new Error(
        `Could not find action with these local keys { forceKey: "${forceKey}", nodeKey: "${nodeKey}", actionKey: "${actionKey}" } in the mission with ID "${missionId}".`,
      )
    }

    if (!(result instanceof ServerMissionAction)) {
      throw new Error(
        `The action with these local keys { forceKey: "${forceKey}", nodeKey: "${nodeKey}", actionKey: "${actionKey}" } was found in the mission with ID "${missionId}", but it is not an instance of ServerMissionAction.`,
      )
    }

    return result
  }

  /**
   * Determines the target file.
   * @param fileId The ID of the file to manipulate.
   * @returns The target file.
   * @throws If a file was specified in the options, but it could
   * not be found.
   */
  private determineTargetFile(fileId: string): ServerMissionFile {
    const { mission, missionId } = this
    // Find the specified file.
    const result = mission.getFileById(fileId)
    if (!result) {
      throw new Error(
        `Could not find file with ID "${fileId}" in the mission with ID "${missionId}".`,
      )
    }
    return result
  }

  /**
   * @inheritdoc TTargetEnvExposedContext.sendOutput
   */
  private sendOutput = (
    message: string,
    { forceKey }: TManipulateForceOptions = {},
  ) => {
    // Parse details.
    const { force, userId } = this
    const targetForce = this.determineTargetForce(forceKey)

    // Create a custom output to send to the output panel.
    this.session.sendOutput(
      targetForce._id,
      force.outputPrefix,
      message,
      { type: 'custom' },
      { userId },
    )
  }

  /**
   * @inheritdoc TTargetEnvExposedContext.blockNode
   */
  private blockNode = ({ forceKey, nodeKey }: TManipulateNodeOptions = {}) => {
    const targetNode = this.determineTargetNode(forceKey, nodeKey)
    this.session.updateNodeBlockStatus(targetNode, true)
  }

  /**
   * @inheritdoc TTargetEnvExposedContext.unblockNode
   */
  private unblockNode = ({ forceKey, nodeKey }: TManipulateNodeOptions) => {
    const targetNode = this.determineTargetNode(forceKey, nodeKey)
    this.session.updateNodeBlockStatus(targetNode, false)
  }

  /**
   * @inheritdoc TTargetEnvExposedContext.modifySuccessChance
   */
  private modifySuccessChance = (
    operand: number,
    { forceKey, nodeKey, actionKey }: TManipulateActionOptions = {},
  ) => {
    const targetAction = this.determineTargetAction(
      forceKey,
      nodeKey,
      actionKey,
    )
    const targetNode = this.determineTargetNode(forceKey, nodeKey)

    this.session.modifySuccessChance({
      operand,
      node: targetNode,
      action: targetAction,
    })
  }

  /**
   * @inheritdoc TTargetEnvExposedContext.modifyProcessTime
   */
  private modifyProcessTime = (
    operand: number,
    { forceKey, nodeKey, actionKey }: TManipulateActionOptions = {},
  ) => {
    const targetAction = this.determineTargetAction(
      forceKey,
      nodeKey,
      actionKey,
    )
    const targetNode = this.determineTargetNode(forceKey, nodeKey)

    this.session.modifyProcessTime({
      operand,
      node: targetNode,
      action: targetAction,
    })
  }

  /**
   * @inheritdoc TTargetEnvExposedContext.modifyResourceCost
   */
  private modifyResourceCost = (
    operand: number,
    { forceKey, nodeKey, actionKey }: TManipulateActionOptions = {},
  ) => {
    const targetAction = this.determineTargetAction(
      forceKey,
      nodeKey,
      actionKey,
    )
    const targetNode = this.determineTargetNode(forceKey, nodeKey)

    this.session.modifyResourceCost({
      operand,
      node: targetNode,
      action: targetAction,
    })
  }

  /**
   * @inheritdoc TTargetEnvExposedContext.modifyResourcePool
   */
  private modifyResourcePool = (
    operand: number,
    { forceKey }: TManipulateForceOptions = {},
  ) => {
    const targetForce = this.determineTargetForce(forceKey)
    this.session.modifyResourcePool(targetForce, operand)
  }

  /**
   * @inheritdoc TTargetEnvExposedContext.grantFileAccess
   */
  private grantFileAccess = (fileId: string, forceKey: string) => {
    const targetFile = this.determineTargetFile(fileId)
    const targetForce = this.determineTargetForce(forceKey)
    this.session.updateFileAccess(targetFile, targetForce, true)
  }

  /**
   * @inheritdoc TTargetEnvExposedContext.revokeFileAccess
   */
  private revokeFileAccess = (fileId: string, forceKey: string) => {
    const targetFile = this.determineTargetFile(fileId)
    const targetForce = this.determineTargetForce(forceKey)
    this.session.updateFileAccess(targetFile, targetForce, false)
  }
}

/* -- TYPES -- */

export type TCommonTargetEnvContext = {}

/**
 * Object representing the context for the target environment.
 */
export type TTargetEnvExposedContext = {
  /**
   * An effect that is applied to its target.
   */
  readonly effect: TTargetEnvExposedEffect
  /**
   * The context of the mission for the target environment.
   */
  readonly mission: TTargetEnvExposedMission
  /**
   * The user who triggered the effect.
   */
  readonly user: TTargetEnvExposedUser
  /**
   * Sends the message to the output panel within a session.
   * @param message The output's message.
   * @param options Additional options for sending the output.
   * @note By default, this will send output to the force to which
   * the effect belongs, unless configured otherwise.
   */
  sendOutput: TargetEnvContext['sendOutput']
  /**
   * Blocks the node from further interaction.
   * @param options Additional options for blocking the node.
   * @note By default, this will block the node to which the current
   * effect belongs, unless configured otherwise.
   */
  blockNode: TargetEnvContext['blockNode']
  /**
   * Unblocks the node allowing further interaction.
   * @param options Additional options for unblocking the node.
   * @note By default, this will unblock the node to which the current
   * effect belongs, unless configured otherwise.
   */
  unblockNode: TargetEnvContext['unblockNode']
  /**
   * Modifies an action's chance of success.
   * @param operand The number used to modify the chance of success.
   * @param options Additional options for modifying the chance of success.
   * @note **If the result is less than 0%, the chance of success will be set to 0%.**
   * @note **If the result is greater than 100%, the chance of success will be set to 100%.**
   * @note This will modify the chance of success for all actions within the node.
   * @note The operand can be positive or negative. It will either increase or decrease the chance of success.
   * @note By default, this will modify the chance of success for the node to which the current effect belongs,
   * unless configured otherwise.
   */
  modifySuccessChance: TargetEnvContext['modifySuccessChance']
  /**
   * Modifies an action's process time.
   * @param operand The number used to modify the process time.
   * @param options Additional options for modifying the process time.
   * @note **If the result is less than 0, the process time will be set to 0.**
   * @note **If the result is greater than 1 hour (3,600,000 milliseconds), the process time will be set to 1 hour.**
   * @note This will modify the process time for all actions within the node.
   * @note The operand can be positive or negative. It will either increase or decrease the process time.
   * @note By default, this will modify the process time for the node to which the current effect belongs,
   * unless configured otherwise.
   */
  modifyProcessTime: TargetEnvContext['modifyProcessTime']
  /**
   * Modifies an action's resource cost.
   * @param operand The number used to modify the resource cost.
   * @param options Additional options for modifying the resource cost.
   * @note **If the result is less than 0, the resource cost will be set to 0.**
   * @note This will modify the resource cost for all actions within the node.
   * @note The operand can be positive or negative. It will either increase or decrease the resource cost.
   * @note By default, this will modify the resource cost for the node to which the current effect belongs,
   * unless configured otherwise.
   */
  modifyResourceCost: TargetEnvContext['modifyResourceCost']
  /**
   * Modifies resource pool by applying the given amount
   * to the resource pool.
   * @param operand The amount by which to modify the resource pool.
   * @param options Additional options for modifying the resource pool.
   * @note A negative value will subtract and a positive
   * value will add to the resource pool.
   * @note By default, this will modify the resource pool for the
   * force to which the current effect belongs, unless configured
   * otherwise.
   */
  modifyResourcePool: TargetEnvContext['modifyResourcePool']
  /**
   * Grants access to the file for the specified force.
   * @param fileId The ID of the file to grant access to.
   * @param forceKey The local key of the force to which to grant access.
   */
  grantFileAccess: TargetEnvContext['grantFileAccess']
  /**
   * Revokes access to the file for the specified force.
   * @param fileId The ID of the file to revoke access from.
   * @param forceKey The local key of the force from which to revoke access.
   */
  revokeFileAccess: TargetEnvContext['revokeFileAccess']
}

/**
 * The context of the mission for the target environment.
 */
export type TTargetEnvExposedMission = {
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
  get forces(): TTargetEnvExposedForce[]
  /**
   * All nodes that exist in the mission.
   */
  get nodes(): TTargetEnvExposedNode[]
}

/**
 * The context of the force for the target environment.
 */
export type TTargetEnvExposedForce = {
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
  readonly nodes: TTargetEnvExposedNode[]
}

/**
 * The context of the node for the target environment.
 */
export type TTargetEnvExposedNode = {
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
  readonly actions: TTargetEnvExposedAction[]
}

/**
 * The context of the action for the target environment.
 */
export type TTargetEnvExposedAction = {
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
  readonly effects: TTargetEnvExposedEffect[]
}

/**
 * The context of the effect for the target environment.
 */
export type TTargetEnvExposedEffect = {
  /**
   * The ID for the effect.
   */
  readonly _id: string
  /**
   * The name for the effect.
   */
  readonly name: string
  /**
   * The name of the force where the effect belongs.
   */
  readonly forceName: string
  /**
   * The arguments used to affect the target.
   */
  readonly args: AnyObject
}

/**
 * The context of the user for the target environment.
 */
export type TTargetEnvExposedUser = {
  /**
   * The ID for the user.
   */
  readonly _id: string
  /**
   * The username for the user.
   */
  readonly username: string
}

/**
 * Options for `TargetEnvContext.sendOutput` method.
 */
export type TSendOutputOptions = {
  /**
   * The ID of the force to which the output is sent.
   * @default this.forceId // The force to which the current effect belongs.
   */
  recipientForceId?: string
}

/**
 * Options for methods that manipulate a node.
 */
export type TManipulateNodeOptions = {
  /**
   * The local key of the node to manipulate.
   * @default this.nodeKey // The node to which the current effect belongs.
   */
  nodeKey?: string
  /**
   * The local key of the force to which the node belongs.
   * @default this.forceKey // The force to which the current effect belongs.
   */
  forceKey?: string
}

/**
 * Options for methods that manipulate a force.
 */
export type TManipulateForceOptions = {
  /**
   * The local key of the force to manipulate.
   * @default this.forceKey // The force to which the current effect belongs.
   */
  forceKey?: string
}

/**
 * Options for methods that manipulate an action.
 */
export type TManipulateActionOptions = {
  /**
   * The local key of the action to manipulate.
   * @note If this is not specified, then all actions within the node
   * will be manipulated.
   * @default undefined
   */
  actionKey?: string
  /**
   * The local key of the node to which the action belongs.
   * @default this.nodeKey // The node to which the current effect belongs.
   */
  nodeKey?: string
  /**
   * The local key of the force to which the action belongs.
   * @default this.forceKey // The force to which the current effect belongs.
   */
  forceKey?: string
}
