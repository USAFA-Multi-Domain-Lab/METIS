import type {
  TEffectExecutionTriggered,
  TEffectSessionTriggered,
  TEffectTrigger,
  TEffectType,
  TOutputContext,
} from 'metis/missions'
import type { TAnyObject } from 'metis/toolbox'
import type {
  ServerActionExecution,
  ServerEffect,
  ServerExecutionOutcome,
  ServerMissionFile,
  ServerMissionForce,
  ServerMissionNode,
} from '../missions'
import { ServerMissionAction } from '../missions'
import type { ServerSessionMember } from '../sessions/ServerSessionMember'
import type { SessionServer, TOutputTo } from '../sessions/SessionServer'
import { TargetEnvStore } from '../sessions/TargetEnvStore'

export class TargetEnvContext<TType extends TEffectType = TEffectType> {
  /**
   * Context data that varies based on the type of effect.
   */
  private readonly data: TSelectTargetEnvData[TType]

  // action/node/force details have been moved into the data object

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
   * A store that is unique to the session and target environment.
   */
  private get localStore() {
    return TargetEnvStore.getStore(
      this.sessionId,
      this.data.effect.environmentId,
    )
  }

  /**
   * A store that is unique to the session, but not to any particular
   * target environment. This allows for data to be shared across different
   * target environments within the same session.
   */
  private get globalStore() {
    return TargetEnvStore.getStore(this.sessionId)
  }

  /**
   * @param session The session for the current context.
   * @param variedContext The context data that varies based on the type of effect.
   */
  private constructor(
    session: SessionServer,
    variedContext: TSelectTargetEnvData[TType],
  ) {
    this.session = session
    this.data = variedContext
  }

  /**
   * Creates a limited context to expose to the target
   * environment scripts.
   */
  public expose(): TTargetEnvExposedContext<TType> {
    let commonContext: TCommonExposedContext<TType> = {
      type: this.data.type as TType,
      effect: this.data.effect.toTargetEnvContext(),
      mission: this.mission.toTargetEnvContext(),
      localStore: this.localStore,
      globalStore: this.globalStore,
      sendOutput: this.sendOutput,
      blockNode: this.blockNode,
      unblockNode: this.unblockNode,
      openNode: this.openNode,
      closeNode: this.closeNode,
      modifySuccessChance: this.modifySuccessChance,
      modifyProcessTime: this.modifyProcessTime,
      modifyResourceCost: this.modifyResourceCost,
      modifyResourcePool: this.modifyResourcePool,
      grantFileAccess: this.grantFileAccess,
      revokeFileAccess: this.revokeFileAccess,
    }

    switch (this.data.type) {
      case 'sessionTriggeredEffect':
        return {
          ...commonContext,
          user: null,
        }
      case 'executionTriggeredEffect':
        return {
          ...commonContext,
          user: this.data.user.toTargetEnvContext(),
        }
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
    if (forceKey === 'self') {
      if (!this.data.sourceForce) {
        throw new Error(
          `No default force available for this context (type="${this.data.type}"). Please specify a forceKey.`,
        )
      }
      return this.data.sourceForce
    }

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

    // Handle any keys that are set to 'self'.
    if (nodeKey === 'self') {
      if (!this.data.sourceNode) {
        throw new Error(
          `No default node available for this context (type="${this.data.type}"). Please specify nodeKey.`,
        )
      }
      return this.data.sourceNode
    }
    if (forceKey === 'self') {
      if (!this.data.sourceForceKey) {
        throw new Error(
          `No default forceKey available for this context (type="${this.data.type}"). Please specify forceKey.`,
        )
      }
      forceKey = this.data.sourceForceKey
    }

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
    if (actionKey === 'self') {
      if (!this.data.sourceAction) {
        throw new Error(
          `No default action available for this context (type="${this.data.type}"). Please specify actionKey.`,
        )
      }
      return this.data.sourceAction
    }
    if (nodeKey === 'self') {
      if (!this.data.sourceNodeKey) {
        throw new Error(
          `No default nodeKey available for this context (type="${this.data.type}"). Please specify nodeKey.`,
        )
      }
      nodeKey = this.data.sourceNodeKey
    }
    if (forceKey === 'self') {
      if (!this.data.sourceForceKey) {
        throw new Error(
          `No default forceKey available for this context (type="${this.data.type}"). Please specify forceKey.`,
        )
      }
      forceKey = this.data.sourceForceKey
    }

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
  private sendOutput = (message: string, to?: TOutputTo) => {
    const { data } = this
    let prefix = ''
    let outputContext: TOutputContext

    // Determine the prefix based on whether
    // a recipient force was specified.
    if (!to) {
      prefix = 'Global'
    } else {
      let targetForce = this.determineTargetForce(to.forceKey)
      prefix = targetForce.outputPrefix
    }

    // Determine the output context based on the effect type.
    switch (data.type) {
      case 'sessionTriggeredEffect':
        outputContext = { type: data.trigger }
        break
      case 'executionTriggeredEffect':
        outputContext = {
          type: data.trigger,
          sourceExecutionId: data.executionId,
        }
        break
    }

    // Send the output in the session.
    this.session.sendOutput(prefix, message, outputContext, to)
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
   * @inheritdoc TTargetEnvExposedContext.openNode
   */
  private openNode = ({ forceKey, nodeKey }: TManipulateNodeOptions = {}) => {
    const targetNode = this.determineTargetNode(forceKey, nodeKey)
    this.session.updateNodeOpenState(targetNode, true)
  }

  /**
   * @inheritdoc TTargetEnvExposedContext.closeNode
   */
  private closeNode = ({ forceKey, nodeKey }: TManipulateNodeOptions = {}) => {
    const targetNode = this.determineTargetNode(forceKey, nodeKey)
    this.session.updateNodeOpenState(targetNode, false)
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

  /**
   * Creates context for a session-triggered effect.
   * @param effect The effect for which the context is purposed.
   * @param session The session where the effect was triggered.
   * @returns The new context.
   */
  public static createSessionContext(
    effect: ServerEffect<'sessionTriggeredEffect'>,
    session: SessionServer,
  ): TargetEnvContext<'sessionTriggeredEffect'> {
    return new TargetEnvContext(session, {
      type: 'sessionTriggeredEffect',
      effect,
      get effectId() {
        return effect._id
      },
      get effectKey() {
        return effect.localKey
      },
      sourceAction: null,
      get sourceActionId() {
        return null
      },
      get sourceActionKey() {
        return null
      },
      sourceNode: null,
      get sourceNodeId() {
        return null
      },
      get sourceNodeKey() {
        return null
      },
      sourceForce: null,
      get sourceForceId() {
        return null
      },
      get sourceForceKey() {
        return null
      },
      get trigger() {
        return effect.trigger
      },
      member: null,
      get memberId() {
        return null
      },
      get user() {
        return null
      },
      get userId() {
        return null
      },
      execution: null,
      get executionId() {
        return null
      },
      get outcome() {
        return null
      },
      get outcomeId() {
        return null
      },
    })
  }

  /**
   * Creates context for a execution-triggered effect.
   * @param effect The effect for which the context is purposed.
   * @param session The session where the effect was triggered.
   * @param member The member responsible for triggering the effect.
   * @param execution The execution responsible for triggering the effect.
   * @returns The new context.
   */
  public static createExecutionContext(
    effect: ServerEffect<'executionTriggeredEffect'>,
    session: SessionServer,
    member: ServerSessionMember,
    execution: ServerActionExecution,
  ): TargetEnvContext<'executionTriggeredEffect'> {
    return new TargetEnvContext(session, {
      type: 'executionTriggeredEffect',
      effect,
      get effectId() {
        return effect._id
      },
      get effectKey() {
        return effect.localKey
      },
      // Source entity context is always present for execution-triggered effects
      sourceAction: effect.sourceAction,
      get sourceActionId() {
        return effect.sourceAction._id
      },
      get sourceActionKey() {
        return effect.sourceAction.localKey
      },
      get sourceNode() {
        return effect.sourceNode
      },
      get sourceNodeId() {
        return effect.sourceNode._id
      },
      get sourceNodeKey() {
        return effect.sourceNode.localKey
      },
      get sourceForce() {
        return effect.sourceForce
      },
      get sourceForceId() {
        return effect.sourceForce._id
      },
      get sourceForceKey() {
        return effect.sourceForce.localKey
      },
      get trigger() {
        return effect.trigger
      },
      member,
      get memberId() {
        return member._id
      },
      get user() {
        return member.user
      },
      get userId() {
        return member.userId
      },
      execution,
      get executionId() {
        return execution._id
      },
      get outcome() {
        return execution.outcome
      },
      get outcomeId() {
        return execution.outcome?._id ?? null
      },
    })
  }
}

/* -- TYPES -- */

/**
 * Exposed context data for an effect specific to
 * session-triggered effects.
 */
interface TExposedContextSession {
  type: 'sessionTriggeredEffect'
  readonly user: null
}

/**
 * Exposed context data for an effect specific to
 * execution-triggered effects.
 */
interface TExposedContextExecution {
  type: 'executionTriggeredEffect'
  readonly user: TTargetEnvExposedUser
}

/**
 * Selects the appropriate exposed context based on the effect type.
 */
type TSelectExposedContext = {
  sessionTriggeredEffect: TExposedContextSession
  executionTriggeredEffect: TExposedContextExecution
}

/**
 * Object representing the context for the target environment.
 */
export type TTargetEnvExposedContext<TType extends TEffectType = TEffectType> =
  {
    /**
     * The type of effect being applied.
     */
    readonly type: TType
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
    readonly user: TSelectExposedContext[TType]['user']
    /**
     * A store that is unique to the session and target environment.
     * This can be used to store and retrieve temporary, random-access
     * data.
     */
    readonly localStore: TargetEnvStore
    /**
     * A store that is unique to the session, but not to any particular
     * target environment. This allows for data to be shared across different
     * target environments within the same session.
     */
    readonly globalStore: TargetEnvStore
    /**
     * Sends the message to the output panel within a session.
     * @param message The output's message.
     * @param options Additional options for sending the output.
     * @note By default, this will send output to the force to which
     * the effect belongs, unless configured otherwise.
     */
    sendOutput: TargetEnvContext<TType>['sendOutput']
    /**
     * Blocks the node from further interaction.
     * @param options Additional options for blocking the node.
     * @note By default, this will block the node to which the current
     * effect belongs, unless configured otherwise.
     */
    blockNode: TargetEnvContext<TType>['blockNode']
    /**
     * Unblocks the node allowing further interaction.
     * @param options Additional options for unblocking the node.
     * @note By default, this will unblock the node to which the current
     * effect belongs, unless configured otherwise.
     */
    unblockNode: TargetEnvContext<TType>['unblockNode']
    /**
     * Opens the node to reveal the next set of nodes in the structure.
     * @param options Additional options for opening the node.
     * @note By default, this will open the node to which the current
     * effect belongs, unless configured otherwise.
     */
    openNode: TargetEnvContext<TType>['openNode']
    /**
     * Closes the node to hide the next set of nodes in the structure.
     * @param options Additional options for closing the node.
     * @note By default, this will close the node to which the current
     * effect belongs, unless configured otherwise.
     */
    closeNode: TargetEnvContext<TType>['closeNode']
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
    modifySuccessChance: TargetEnvContext<TType>['modifySuccessChance']
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
    modifyProcessTime: TargetEnvContext<TType>['modifyProcessTime']
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
    modifyResourceCost: TargetEnvContext<TType>['modifyResourceCost']
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
    modifyResourcePool: TargetEnvContext<TType>['modifyResourcePool']
    /**
     * Grants access to the file for the specified force.
     * @param fileId The ID of the file to grant access to.
     * @param forceKey The local key of the force to which to grant access.
     */
    grantFileAccess: TargetEnvContext<TType>['grantFileAccess']
    /**
     * Revokes access to the file for the specified force.
     * @param fileId The ID of the file to revoke access from.
     * @param forceKey The local key of the force from which to revoke access.
     */
    revokeFileAccess: TargetEnvContext<TType>['revokeFileAccess']
  }

/**
 * Exposed context for an effect that is common between varied
 * effect types.
 */
type TCommonExposedContext<TType extends TEffectType> = Omit<
  TTargetEnvExposedContext<TType>,
  Exclude<keyof TExposedContextSession | keyof TExposedContextExecution, 'type'>
>

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
   * The type of effect being used.
   */
  readonly type: TEffectType
  /**
   * The trigger for the effect.
   */
  readonly trigger: TEffectTrigger
  /**
   * The arguments used to affect the target.
   */
  readonly args: TAnyObject
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

/**
 * Context data specific to session-triggered effects.
 */
type TContextDataSession = {
  /**
   * The type of effect for the current context.
   */
  type: 'sessionTriggeredEffect'
  /**
   * The effect for the current context.
   */
  effect: ServerEffect<'sessionTriggeredEffect'>
  /**
   * The ID of the effect for the current context.
   */
  get effectId(): string
  /**
   * The local key of the effect for the current context.
   */
  get effectKey(): string
  /**
   * The action which directly or indirectly hosts the effect.
   */
  get sourceAction(): null
  /**
   * The ID of the action which directly or indirectly
   * hosts the effect.
   */
  get sourceActionId(): null
  /**
   * The local key of the action which directly or indirectly
   * hosts the effect.
   */
  get sourceActionKey(): null
  /**
   * The node which directly or indirectly hosts the effect.
   */
  get sourceNode(): null
  /**
   * The ID of the node which directly or indirectly hosts
   * the effect.
   */
  get sourceNodeId(): null
  /**
   * The local key of the node which directly or indirectly
   * hosts the effect.
   */
  get sourceNodeKey(): null
  /**
   * The force which directly or indirectly hosts the effect.
   */
  get sourceForce(): null
  /**
   * The ID of the force which directly or indirectly hosts
   * the effect.
   */
  get sourceForceId(): null
  /**
   * The local key of the force which directly or indirectly hosts
   *  the effect.
   */
  get sourceForceKey(): null
  /**
   * The trigger that caused the effect to be applied.
   */
  get trigger(): TEffectSessionTriggered
  /**
   * The member responsible for the effect being triggered.
   */
  member: null
  /**
   * The ID of the member responsible for the effect being triggered.
   */
  get memberId(): null
  /**
   * The action-execution that resulted in the effect being triggered.
   */
  execution: null
  /**
   * The user that triggered the effect.
   */
  get user(): null
  /**
   * The ID of the user that triggered the effect.
   */
  get userId(): null
  /**
   * The ID of the action-execution that resulted in the effect being triggered.
   */
  get executionId(): null
  /**
   * The outcome related to the execution that triggered the effect.
   */
  get outcome(): null
  /**
   * The ID of the outcome related to the execution that triggered the effect.
   */
  get outcomeId(): null
}

/**
 * Context data specific to execution-triggered effects.
 */
type TContextDataExecution = {
  /**
   * The type of effect for the current context.
   */
  type: 'executionTriggeredEffect'
  /**
   * The effect for the current context.
   */
  effect: ServerEffect<'executionTriggeredEffect'>
  /**
   * The ID of the effect for the current context.
   */
  get effectId(): string
  /**
   * The local key of the effect for the current context.
   */
  get effectKey(): string
  /**
   * The action which directly or indirectly hosts the effect.
   */
  get sourceAction(): ServerMissionAction
  /**
   * The ID of the action which directly or indirectly
   * hosts the effect.
   */
  get sourceActionId(): string
  /**
   * The local key of the action which directly or indirectly
   * hosts the effect.
   */
  get sourceActionKey(): string
  /**
   * The node which directly or indirectly hosts the effect.
   */
  get sourceNode(): ServerMissionNode
  /**
   * The ID of the node which directly or indirectly hosts
   * the effect.
   */
  get sourceNodeId(): string
  /**
   * The local key of the node which directly or indirectly
   * hosts the effect.
   */
  get sourceNodeKey(): string
  /**
   * The force which directly or indirectly hosts the effect.
   */
  get sourceForce(): ServerMissionForce
  /**
   * The ID of the force which directly or indirectly hosts
   * the effect.
   */
  get sourceForceId(): string
  /**
   * The local key of the force which directly or indirectly
   * hosts the effect.
   */
  get sourceForceKey(): string
  /**
   * The trigger that caused the effect to be applied.
   */
  get trigger(): TEffectExecutionTriggered
  /**
   * The member responsible for the effect being triggered.
   */
  member: ServerSessionMember
  /**
   * The ID of the member responsible for the effect being triggered.
   */
  get memberId(): string
  /**
   * The user that triggered the effect.
   */
  get user(): ServerSessionMember['user']
  /**
   * The ID of the user that triggered the effect.
   */
  get userId(): string
  /**
   * The action-execution that resulted in the effect being triggered.
   */
  execution: ServerActionExecution
  /**
   * The ID of the action-execution that resulted in the effect being triggered.
   */
  get executionId(): string
  /**
   * The outcome related to the execution that triggered the effect.
   */
  get outcome(): ServerExecutionOutcome | null
  /**
   * The ID of the outcome related to the execution that triggered the effect.
   */
  get outcomeId(): string | null
}

/**
 * Mapping of effect types to their specific context data.
 */
export type TSelectTargetEnvData = {
  sessionTriggeredEffect: TContextDataSession
  executionTriggeredEffect: TContextDataExecution
}
