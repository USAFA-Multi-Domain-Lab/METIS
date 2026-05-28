import type { ServerActionExecution } from '@server/missions/actions/ServerActionExecution'
import type { ServerExecutionOutcome } from '@server/missions/actions/ServerExecutionOutcome'
import type { ServerMissionAction } from '@server/missions/actions/ServerMissionAction'
import type { ServerEffect } from '@server/missions/effects/ServerEffect'
import type { ServerMissionFile } from '@server/missions/files/ServerMissionFile'
import type { ServerMissionForce } from '@server/missions/forces/ServerMissionForce'
import type { ServerResourcePool } from '@server/missions/forces/ServerResourcePool'
import type { ServerMissionNode } from '@server/missions/nodes/ServerMissionNode'
import type { TNodeAlertSeverityLevel } from '@shared/missions/nodes/NodeAlert'
import type { TSessionState } from '@shared/sessions/MissionSession'
import type { TInstanceOrArray } from '@shared/toolbox/arrays/ArrayToolbox'
import { ArrayToolbox } from '@shared/toolbox/arrays/ArrayToolbox'
import type {
  TEffectExecutionTriggered,
  TEffectSessionTriggered,
  TEffectType,
} from '../../../shared/missions/effects/Effect'
import type { TOutputContext } from '../../../shared/missions/forces/MissionOutput'
import type { ServerSessionMember } from '../../sessions/ServerSessionMember'
import type { SessionServer } from '../../sessions/SessionServer'
import type {
  TTargetEnvExposedAction,
  TTargetEnvExposedContext,
  TTargetEnvExposedFile,
  TTargetEnvExposedForce,
  TTargetEnvExposedMission,
  TTargetEnvExposedNode,
  TTargetEnvExposedPool,
  TTargetEnvExposedResource,
} from './TargetEnvContext'
import {
  TargetEnvContext,
  type TTargetEnvExposedEffect,
  type TTargetEnvExposedMember,
} from './TargetEnvContext'

/**
 * Context that is provided to target scripts when
 * they are called during a session.
 */
export class TargetScriptContext<
  TType extends TEffectType = TEffectType,
> extends TargetEnvContext<TTargetScriptExposedContext<TType>> {
  // Implemented
  protected get permittedStates(): TSessionState[] {
    switch (this.data.type) {
      case 'sessionTriggeredEffect':
        switch (this.data.trigger) {
          case 'session-setup':
            return ['starting', 'resetting']
          case 'session-start':
            return ['started']
          case 'session-teardown':
            return ['ending', 'resetting']
        }
      case 'executionTriggeredEffect':
        return ['started']
    }
  }

  /**
   * Context data that varies based on the type of effect.
   */
  protected readonly data: TSelectTargetEnvData[TType]

  /**
   * @param session The session for the current context.
   * @param variedContext The context data that varies based on the type of effect.
   */
  protected constructor(
    session: SessionServer,
    variedContext: TSelectTargetEnvData[TType],
  ) {
    if (!variedContext.effect.environment) {
      throw new Error(
        'Effect has no associated target environment. A target environment is necessary for context creation.',
      )
    }
    super(session, variedContext.effect.environment)
    this.data = variedContext
  }

  // Implemented
  protected expose(): TTargetScriptExposedContext<TType> {
    let commonContext: TCommonTargetScriptContext<TType> = {
      type: this.data.type as TType,
      effect: this.data.effect.toTargetEnvContext(),
      ...this.exposeCommon(),
      sendOutput: this.ifContextIsCurrent(this.sendOutput.bind(this)),
      blockNodes: this.ifContextIsCurrent(this.blockNodes.bind(this)),
      unblockNodes: this.ifContextIsCurrent(this.unblockNodes.bind(this)),
      updateNodeBlockStatus: this.ifContextIsCurrent(
        this.updateNodeBlockStatus.bind(this),
      ),
      openNode: this.ifContextIsCurrent(this.openNode.bind(this)),
      closeNode: this.ifContextIsCurrent(this.closeNode.bind(this)),
      updateNodeOpenState: this.ifContextIsCurrent(
        this.updateNodeOpenState.bind(this),
      ),
      addNodeAlert: this.ifContextIsCurrent(this.addNodeAlert.bind(this)),
      modifySuccessChance: this.ifContextIsCurrent(
        this.modifySuccessChance,
      ).bind(this),
      modifyProcessTime: this.ifContextIsCurrent(
        this.modifyProcessTime.bind(this),
      ),
      modifyResourceCost: this.ifContextIsCurrent(
        this.modifyResourceCost.bind(this),
      ),
      modifyResourcePool: this.ifContextIsCurrent(
        this.modifyResourcePool.bind(this),
      ),
      grantFileAccess: this.ifContextIsCurrent(this.grantFileAccess.bind(this)),
      revokeFileAccess: this.ifContextIsCurrent(
        this.revokeFileAccess.bind(this),
      ),
      updateFileAccess: this.ifContextIsCurrent(
        this.updateFileAccess.bind(this),
      ),
    }

    switch (this.data.type) {
      case 'sessionTriggeredEffect':
        return {
          ...commonContext,
          triggeredBy: null,
        }
      case 'executionTriggeredEffect':
        return {
          ...commonContext,
          triggeredBy: this.data.member.toTargetEnvContext(),
        }
    }
  }

  /**
   * Takes one or many files exposed to the target environment and
   * resolves them to a list of corresponding {@link ServerMissionFile}
   * instances found within the mission.
   * @param files The file or files exposed to the target environment to resolve.
   * @returns A list of corresponding {@link ServerMissionFile} instances found within the mission.
   * @throws If a file cannot be found within the mission.
   */
  private resolveServerFiles(
    files: TInstanceOrArray<TTargetEnvExposedFile>,
  ): ServerMissionFile[] {
    return ArrayToolbox.toArray(files).map((file) => {
      let serverFile = this.mission.getFileById(file._id)
      if (!serverFile) {
        throw new Error(
          `Could not find file with ID "${file._id}" in the mission with ID "${this.missionId}".`,
        )
      }
      return serverFile
    })
  }

  /**
   * Takes one or many components exposed to the target environment
   * that either are or contain forces and resolves them to a list of
   * corresponding {@link ServerMissionForce} instances found within
   * the mission.
   * {@link ServerMissionForce} instances found within the mission.
   * @param missionComponents The force or forces exposed to the target environment to resolve.
   * @returns A list of corresponding {@link ServerMissionForce} instances found within the mission.
   * @throws If a force cannot be found within the mission.
   */
  private resolveServerForces(
    missionComponents: TInstanceOrArray<
      TTargetEnvExposedForce | TTargetEnvExposedMission
    >,
  ): ServerMissionForce[] {
    missionComponents = ArrayToolbox.toArray(missionComponents)
    let targetEnvForces = missionComponents.flatMap((component) => {
      switch (component.componentType) {
        case 'mission':
          return component.forces
        case 'force':
          return component
      }
    })
    return targetEnvForces.map((force) => {
      let serverForce = this.mission.getForceById(force._id)
      if (!serverForce) {
        throw new Error(
          `Could not find force with ID "${force._id}" in the mission with ID "${this.missionId}".`,
        )
      }
      return serverForce
    })
  }

  /**
   * Takes one or many components exposed to the target environment
   * that either are or contain resource pools and resolves them to a
   * flat list of corresponding {@link ServerResourcePool} instances
   * found within the mission.
   * @param missionComponents The component or components to resolve.
   * @returns A flat array of {@link ServerResourcePool} instances.
   * @throws If any pool cannot be found within the mission.
   */
  private resolveServerPools(
    missionComponents: TInstanceOrArray<
      TTargetEnvExposedPool | TTargetEnvExposedForce | TTargetEnvExposedMission
    >,
  ): ServerResourcePool[] {
    missionComponents = ArrayToolbox.toArray(missionComponents)
    let targetEnvPools = missionComponents.flatMap((component) => {
      switch (component.componentType) {
        case 'mission':
          return component.forces.flatMap((force) => force.resourcePools)
        case 'force':
          return component.resourcePools
        case 'resourcePool':
          return component
      }
    })
    return targetEnvPools.map((pool) => {
      let serverPool = this.mission.getPoolById(pool._id)
      if (!serverPool) {
        throw new Error(
          `Could not find resource pool with ID "${pool._id}" in the mission with ID "${this.missionId}".`,
        )
      }
      return serverPool
    })
  }

  /**
   * Takes one or many components exposed to the target environment
   * that either are or contain nodes and resolves them to a list of
   * corresponding {@link ServerMissionNode} instances found within
   * the mission.
   * {@link ServerMissionNode} instances found within the mission.
   * @param missionComponents The node or nodes exposed to the target environment to resolve.
   * @returns A list of corresponding {@link ServerMissionNode} instances found within the mission.
   * @throws If a node cannot be found within the mission.
   */
  private resolveServerNodes(
    missionComponents: TInstanceOrArray<
      TTargetEnvExposedNode | TTargetEnvExposedForce | TTargetEnvExposedMission
    >,
  ): ServerMissionNode[] {
    missionComponents = ArrayToolbox.toArray(missionComponents)
    let targetEnvNodes = missionComponents.flatMap((component) => {
      switch (component.componentType) {
        case 'mission':
          return component.allNodes
        case 'force':
          return component.nodes
        case 'node':
          return component
      }
    })
    return targetEnvNodes.map((targetEnvNode) => {
      let serverNode = this.mission.getNodeById(targetEnvNode._id)
      if (!serverNode) {
        throw new Error(
          `Could not find node with ID "${targetEnvNode._id}" in the mission with ID "${this.missionId}".`,
        )
      }
      return serverNode
    })
  }
  /**
   * Takes one or many components exposed to the target environment
   * that either are or contain actions and resolves them to a flat
   * list of corresponding {@link ServerMissionAction} instances
   * found within the mission.
   * @param missionComponents The component or components to resolve.
   * @returns A flat array of {@link ServerMissionAction} instances.
   * @throws If any action cannot be found within the mission.
   */
  private resolveServerActionTargets(
    missionComponents: TInstanceOrArray<
      | TTargetEnvExposedNode
      | TTargetEnvExposedForce
      | TTargetEnvExposedMission
      | TTargetEnvExposedAction
    >,
  ): ServerMissionAction[] {
    missionComponents = ArrayToolbox.toArray(missionComponents)
    let targetEnvActions = missionComponents.flatMap((component) => {
      switch (component.componentType) {
        case 'mission':
          return component.allActions
        case 'force':
          return component.nodes.flatMap((node) => node.actions)
        case 'node':
          return component.actions
        case 'action':
          return component
      }
    })
    return targetEnvActions.map((targetEnvAction) => {
      let serverAction = this.mission.getActionById(targetEnvAction._id)
      if (!serverAction) {
        throw new Error(
          `Could not find action with ID "${targetEnvAction._id}" in the mission with ID "${this.missionId}".`,
        )
      }
      return serverAction
    })
  }

  /**
   * @see {@link TTargetScriptExposedContext.sendOutput}
   */
  private sendOutput = (
    message: string,
    to: TInstanceOrArray<TTargetEnvExposedForce | TTargetEnvExposedMission>,
  ) => {
    let { data } = this
    let outputContext: TOutputContext
    let isGlobal = ArrayToolbox.toArray(to).some(
      (component) => component.componentType === 'mission',
    )

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

    if (isGlobal) {
      this.session.sendOutput('Global:', message, outputContext)
    } else {
      let forces = this.resolveServerForces(to)

      // Send the output to each resolved force.
      for (let force of forces) {
        this.session.sendOutput(force.outputPrefix, message, outputContext, {
          force,
        })
      }
    }
  }

  /**
   * @see {@link TTargetScriptExposedContext}
   */
  private blockNodes = (
    nodes: TInstanceOrArray<
      TTargetEnvExposedNode | TTargetEnvExposedForce | TTargetEnvExposedMission
    >,
  ) => {
    this.updateNodeBlockStatus(nodes, true)
  }

  /**
   * @see {@link TTargetScriptExposedContext}
   */
  private unblockNodes = (
    nodes: TInstanceOrArray<
      TTargetEnvExposedNode | TTargetEnvExposedForce | TTargetEnvExposedMission
    >,
  ) => {
    this.updateNodeBlockStatus(nodes, false)
  }

  /**
   * @see {@link TTargetScriptExposedContext}
   */
  private updateNodeBlockStatus = (
    nodes: TInstanceOrArray<
      TTargetEnvExposedNode | TTargetEnvExposedForce | TTargetEnvExposedMission
    >,
    blocked: boolean,
  ) => {
    this.session.updateNodeBlockStatus(this.resolveServerNodes(nodes), blocked)
  }

  /**
   * @see {@link TTargetScriptExposedContext}
   */
  private openNode = (
    nodes: TInstanceOrArray<
      TTargetEnvExposedNode | TTargetEnvExposedForce | TTargetEnvExposedMission
    >,
  ) => {
    this.updateNodeOpenState(nodes, true)
  }

  /**
   * @see {@link TTargetScriptExposedContext}
   */
  private closeNode = (
    nodes: TInstanceOrArray<
      TTargetEnvExposedNode | TTargetEnvExposedForce | TTargetEnvExposedMission
    >,
  ) => {
    this.updateNodeOpenState(nodes, false)
  }

  /**
   * @see {@link TTargetScriptExposedContext}
   */
  private updateNodeOpenState = (
    nodes: TInstanceOrArray<
      TTargetEnvExposedNode | TTargetEnvExposedForce | TTargetEnvExposedMission
    >,
    opened: boolean,
  ) => {
    this.resolveServerNodes(nodes).forEach((serverNode) => {
      this.session.updateNodeOpenState(serverNode, opened)
    })
  }

  /**
   * @see {@link TTargetScriptExposedContext}
   */
  private addNodeAlert = (
    applyTo: TInstanceOrArray<
      TTargetEnvExposedNode | TTargetEnvExposedForce | TTargetEnvExposedMission
    >,
    message: string,
    severityLevel: TNodeAlertSeverityLevel,
  ) => {
    this.resolveServerNodes(applyTo).forEach((serverNode) => {
      this.session.addNodeAlert(serverNode, message, severityLevel)
    })
  }

  /**
   * @see {@link TTargetScriptExposedContext}
   */
  private modifySuccessChance = (
    applyTo: TInstanceOrArray<
      | TTargetEnvExposedAction
      | TTargetEnvExposedNode
      | TTargetEnvExposedForce
      | TTargetEnvExposedMission
    >,
    operand: number,
  ) => {
    this.resolveServerActionTargets(applyTo).forEach((action) => {
      this.session.modifySuccessChance({ operand, action })
    })
  }

  /**
   * @see {@link TTargetScriptExposedContext}
   */
  private modifyProcessTime = (
    applyTo: TInstanceOrArray<
      | TTargetEnvExposedAction
      | TTargetEnvExposedNode
      | TTargetEnvExposedForce
      | TTargetEnvExposedMission
    >,
    operand: number,
  ) => {
    this.resolveServerActionTargets(applyTo).forEach((action) => {
      this.session.modifyProcessTime({ operand, action })
    })
  }

  /**
   * @see {@link TTargetScriptExposedContext}
   */
  private modifyResourceCost = (
    applyTo: TInstanceOrArray<
      | TTargetEnvExposedAction
      | TTargetEnvExposedNode
      | TTargetEnvExposedForce
      | TTargetEnvExposedMission
    >,
    resources: TInstanceOrArray<TTargetEnvExposedResource>,
    operand: number,
  ) => {
    this.resolveServerActionTargets(applyTo).forEach((action) => {
      ArrayToolbox.toArray(resources).forEach((resource) => {
        this.session.modifyResourceCost({
          resourceId: resource._id,
          action,
          operand,
        })
      })
    })
  }

  /**
   * @see {@link TTargetScriptExposedContext}
   */
  private modifyResourcePool = (
    applyTo: TInstanceOrArray<
      TTargetEnvExposedPool | TTargetEnvExposedForce | TTargetEnvExposedMission
    >,
    operand: number,
  ) => {
    this.resolveServerPools(applyTo).forEach((serverPool) => {
      this.session.modifyResourcePool(serverPool, operand)
    })
  }

  /**
   * @see {@link TTargetScriptExposedContext}
   */
  private grantFileAccess = (
    applyTo: TInstanceOrArray<
      TTargetEnvExposedForce | TTargetEnvExposedMission
    >,
    files: TInstanceOrArray<TTargetEnvExposedFile>,
  ) => {
    this.updateFileAccess(applyTo, files, true)
  }

  /**
   * @see {@link TTargetScriptExposedContext}
   */
  private revokeFileAccess = (
    applyTo: TInstanceOrArray<
      TTargetEnvExposedForce | TTargetEnvExposedMission
    >,
    files: TInstanceOrArray<TTargetEnvExposedFile>,
  ) => {
    this.updateFileAccess(applyTo, files, false)
  }

  /**
   * @see {@link TTargetScriptExposedContext}
   */
  private updateFileAccess = (
    applyTo: TInstanceOrArray<
      TTargetEnvExposedForce | TTargetEnvExposedMission
    >,
    files: TInstanceOrArray<TTargetEnvExposedFile>,
    granted: boolean,
  ) => {
    this.session.updateFileAccess(
      this.resolveServerForces(applyTo),
      this.resolveServerFiles(files),
      granted,
    )
  }

  /**
   * Creates context for a session-triggered effect.
   * @param effect The effect for which the context is purposed.
   * @param session The session where the effect was triggered.
   * @param environment The target environment where the effect was triggered.
   * @returns The new context.
   */
  public static createSessionContext(
    effect: ServerEffect<'sessionTriggeredEffect'>,
    session: SessionServer,
  ): TargetScriptContext<'sessionTriggeredEffect'> {
    return new TargetScriptContext(session, {
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
   * @param environment The target environment where the effect was triggered.
   * @param member The member responsible for triggering the effect.
   * @param execution The execution responsible for triggering the effect.
   * @returns The new context.
   */
  public static createExecutionContext(
    effect: ServerEffect<'executionTriggeredEffect'>,
    session: SessionServer,
    member: ServerSessionMember,
    execution: ServerActionExecution,
  ): TargetScriptContext<'executionTriggeredEffect'> {
    return new TargetScriptContext(session, {
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
  readonly triggeredBy: null
}

/**
 * Exposed context data for an effect specific to
 * execution-triggered effects.
 */
interface TExposedContextExecution {
  type: 'executionTriggeredEffect'
  readonly triggeredBy: TTargetEnvExposedMember
}

/**
 * Selects the appropriate exposed context based on the effect type.
 */
type TSelectExposedContext = {
  sessionTriggeredEffect: TExposedContextSession
  executionTriggeredEffect: TExposedContextExecution
}

/**
 * Data exposed to a target script as an object.
 */
export interface TTargetScriptExposedContext<
  TType extends TEffectType = TEffectType,
> extends TTargetEnvExposedContext {
  /**
   * The type of effect being applied.
   */
  readonly type: TType
  /**
   * An effect that is applied to its target.
   */
  readonly effect: TTargetEnvExposedEffect
  /**
   * The member who triggered the effect.
   */
  readonly triggeredBy: TSelectExposedContext[TType]['triggeredBy']
  /**
   * Sends the message to the output panel within a session.
   * @param message The output's message.
   * @param options Additional options for sending the output.
   * @note By default, this will send output to the force to which
   * the effect belongs, unless configured otherwise.
   */
  sendOutput: TargetScriptContext<TType>['sendOutput']
  /**
   * Blocks the provided nodes from further interaction.
   * @param nodes The node or nodes to block.
   */
  blockNodes: TargetScriptContext<TType>['blockNodes']
  /**
   * Unblocks the provided nodes allowing further interaction.
   * @param nodes The node or nodes to unblock.
   */
  unblockNodes: TargetScriptContext<TType>['unblockNodes']
  /**
   * Updates the block status of one or many nodes (block/unblock).
   * @param nodes The node or nodes to update the block status for.
   * @param blocked Whether the nodes should be blocked or unblocked.
   * @note Forces and the mission can also be passed. All nodes within
   * the provided forces/mission will be updated.
   */
  updateNodeBlockStatus: TargetScriptContext<TType>['updateNodeBlockStatus']
  /**
   * Opens one or many nodes to reveal the next set of nodes in the structure.
   * @param nodes The node or nodes to open.
   * @note Forces and the mission can also be passed. All nodes within
   * the provided forces/mission will be opened.
   */
  openNode: TargetScriptContext<TType>['openNode']
  /**
   * Closes one or many nodes to hide the next set of nodes in the structure.
   * @param nodes The node or nodes to close.
   * @note Forces and the mission can also be passed. All nodes within
   * the provided forces/mission will be closed.
   */
  closeNode: TargetScriptContext<TType>['closeNode']
  /**
   * Updates the open state of one or many nodes (open/close).
   * @param nodes The node or nodes to update the open state for.
   * @param opened Whether the nodes should be opened or closed.
   * @note Forces and the mission can also be passed. All nodes within
   * the provided forces/mission will be updated.
   */
  updateNodeOpenState: TargetScriptContext<TType>['updateNodeOpenState']
  /**
   * Adds an alert to the given node(s) with the specified severity level.
   * @param applyTo The node, force, or mission to add the alert to.
   * @param message The message to display when the alert is opened.
   * @param severityLevel The severity level of the alert, indicating
   * the importance/urgency of the alert.
   * @note Passing a force or mission will add the alert to all nodes within
   * the provided force or mission.
   */
  addNodeAlert: TargetScriptContext<TType>['addNodeAlert']
  /**
   * Modifies the chance of success for the provided components.
   * @param applyTo The component or components whose actions will be modified.
   * @param operand The number used to modify the chance of success.
   * @note **If the result is less than 0%, the chance of success will be set to 0%.**
   * @note **If the result is greater than 100%, the chance of success will be set to 100%.**
   * @note The operand can be positive or negative. It will either increase or decrease the chance of success.
   * @note Passing a node, force, or mission will modify all actions within the selected item.
   * @note Passing an action will modify only that specific action.
   */
  modifySuccessChance: TargetScriptContext<TType>['modifySuccessChance']
  /**
   * Modifies the process time for the provided components.
   * @param applyTo The component or components whose actions will be modified.
   * @param operand The number used to modify the process time.
   * @note **If the result is less than 0, the process time will be set to 0.**
   * @note **If the result is greater than 1 hour (3,600,000 milliseconds), the process time will be set to 1 hour.**
   * @note The operand can be positive or negative. It will either increase or decrease the process time.
   * @note Passing a node, force, or mission will modify all actions within the selected item.
   * @note Passing an action will modify only that specific action.
   */
  modifyProcessTime: TargetScriptContext<TType>['modifyProcessTime']
  /**
   * Modifies the resource cost for the provided components.
   * @param applyTo The component or components whose actions will be modified.
   * @param resources The resource or resources whose cost to modify.
   * @param operand The number used to modify the resource cost.
   * @note The operand can be positive or negative. It will either increase or decrease the resource cost.
   * @note Passing a node, force, or mission will modify all actions within the selected item.
   * @note Passing an action will modify only that specific action.
   */
  modifyResourceCost: TargetScriptContext<TType>['modifyResourceCost']
  /**
   * Modifies a resource pool by applying the given amount to the pool for the given resource.
   * @param resourceId The ID of the resource whose pool to modify.
   * @param operand The amount by which to modify the resource pool.
   * @param options Additional options for modifying the resource pool.
   * @note A negative value will subtract and a positive
   * value will add to the resource pool.
   * @note By default, this will modify the resource pool for the
   * force to which the current effect belongs, unless configured
   * otherwise.
   */
  modifyResourcePool: TargetScriptContext<TType>['modifyResourcePool']
  /**
   * Grants access to the specified files for the specified forces.
   * @param applyTo The component or components whose forces will be modified.
   * @param files The files to grant access to.
   * @note Passing the mission will modify access for all forces within the mission.
   * @note Passing a force will modify access for that specific force.
   */
  grantFileAccess: TargetScriptContext<TType>['grantFileAccess']
  /**
   * Revokes access to the specified files for the specified forces.
   * @param applyTo The component or components whose forces will be modified.
   * @param files The files to revoke access from.
   * @note Passing the mission will modify access for all forces within the mission.
   * @note Passing a force will modify access for that specific force.
   */
  revokeFileAccess: TargetScriptContext<TType>['revokeFileAccess']
  /**
   * Grants or revokes access to the specified files for the specified forces.
   * @param applyTo The component or components whose forces will be modified.
   * @param files The files to grant access to or revoke access from.
   * @param granted Whether to grant or revoke access.
   * @note Passing the mission will modify access for all forces within the mission.
   * @note Passing a force will modify access for that specific force.
   */
  updateFileAccess: TargetScriptContext<TType>['updateFileAccess']
}

/**
 * Exposed context for an effect that is common between varied
 * effect types.
 */
type TCommonTargetScriptContext<TType extends TEffectType> = Omit<
  TTargetScriptExposedContext<TType>,
  Exclude<keyof TExposedContextSession | keyof TExposedContextExecution, 'type'>
>

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
 * Options for methods that manipulate a pool.
 */
export type TManipulatePoolOptions = {
  /**
   * The local key of the force to which the pool belongs.
   * @default this.forceKey // The force to which the current effect belongs.
   */
  forceKey?: string
  /**
   * The local key of the pool to manipulate.
   */
  poolKey?: string
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
