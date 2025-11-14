import { generateValidationError } from '@server/database/validation'
import type { TTargetEnvExposedNode } from '@server/target-environments/context/TargetEnvContext'
import type { TActionExecutionJson } from '@shared/missions/actions/ActionExecution'
import type { TMissionActionJson } from '@shared/missions/actions/MissionAction'
import type { TMissionNodeJson } from '@shared/missions/nodes/MissionNode'
import { MissionNode } from '@shared/missions/nodes/MissionNode'
import { NumberToolbox } from '@shared/toolbox/numbers/NumberToolbox'
import { ServerActionExecution } from '../actions/ServerActionExecution'
import type { ServerExecutionOutcome } from '../actions/ServerExecutionOutcome'
import { ServerMissionAction } from '../actions/ServerMissionAction'

/**
 * Class for managing mission nodes on a session server.
 */
export class ServerMissionNode extends MissionNode<TMetisServerComponents> {
  // Implemented
  public get exclude(): boolean {
    return this._exclude
  }
  public set exclude(value: boolean) {
    this._exclude = value
  }

  // Implemented
  protected importActions(data: TMissionActionJson[]): void {
    data.forEach((datum) => {
      let action: ServerMissionAction = new ServerMissionAction(this, datum)
      this.actions.set(action._id, action)
    })
  }

  // Implemented
  protected importExecutions(data: TActionExecutionJson[]): void {
    this._executions = data.map(
      ({ _id, actionId, outcome: outcomeData, start, end }) => {
        let action: ServerMissionAction | undefined = this.actions.get(actionId)
        if (!action) throw new Error(`Action "${actionId}" not found.`)
        return new ServerActionExecution(_id, action, start, end, {
          outcomeData,
        })
      },
    )
  }

  /**
   * Sets the open state of the node, opening or closing it as specified.
   * @param open True to open the node, false to close it.
   * @note If the node is not openable/closable, this method will silently return without making changes.
   * @note When opening: If the node is currently executing an action, that execution will be aborted.
   * @note When closing: All descendant nodes' executions will also be aborted to prevent orphaned executions.
   */
  public openState(open: boolean): void {
    if (open) {
      // Abort any in-progress execution on this node before opening.
      if (this.executing && this.latestExecution) {
        this.latestExecution.abort()
      }
      this.open()
    } else {
      // Abort any in-progress executions on descendants before closing.
      this.descendants.forEach((descendant) => {
        if (descendant.executing && descendant.latestExecution) {
          descendant.latestExecution.abort()
        }
      })
      this.close()
    }
  }

  // Implemented
  public modifySuccessChance(
    successChanceOperand: number,
    actionId?: string,
  ): void {
    if (!actionId) {
      this.actions.forEach((action) => {
        action.modifySuccessChance(successChanceOperand)
      })
    } else {
      const action = this.actions.get(actionId)
      if (!action) throw new Error(`Action "${actionId}" not found.`)
      action.modifySuccessChance(successChanceOperand)
    }
  }

  // Implemented
  public modifyProcessTime(
    processTimeOperand: number,
    actionId?: string,
  ): void {
    if (!actionId) {
      this.actions.forEach((action) => {
        action.modifyProcessTime(processTimeOperand)
      })
    } else {
      const action = this.actions.get(actionId)
      if (!action) throw new Error(`Action "${actionId}" not found.`)
      action.modifyProcessTime(processTimeOperand)
    }
  }

  // Implemented
  public modifyResourceCost(
    resourceCostOperand: number,
    actionId?: string,
  ): void {
    if (!actionId) {
      this.actions.forEach((action) => {
        action.modifyResourceCost(resourceCostOperand)
      })
    } else {
      const action = this.actions.get(actionId)
      if (!action) throw new Error(`Action "${actionId}" not found.`)
      action.modifyResourceCost(resourceCostOperand)
    }
  }

  /**
   * @returns The properties from the node that are
   * safe to expose in target-environment code.
   */
  public toTargetEnvContext(): TTargetEnvExposedNode {
    const self = this
    return {
      _id: self._id,
      localKey: self.localKey,
      name: self.name,
      description: self.description,
      color: self.color,
      device: self.device,
      initiallyBlocked: self.initiallyBlocked,
      get position() {
        // Clone to prevent external mutation.
        return self.position.clone()
      },
      // These properties are getters so that if
      // they update during a target scripts' execution,
      // the latest values are always returned.
      get openable() {
        return self.openable
      },
      get closable() {
        return self.closable
      },
      get opened() {
        return self.opened
      },
      get revealed() {
        return self.revealed
      },
      get blocked() {
        return self.blocked
      },
      get executing() {
        return self.executing
      },
      get executed() {
        return self.executed
      },
      get executionState() {
        return self.executionState
      },
      get executionStatus() {
        return self.executionStatus
      },
      // Getters here are to save on serialization size.
      get mission() {
        return self.mission.toTargetEnvContext()
      },
      get force() {
        return self.force.toTargetEnvContext()
      },
      get actions() {
        return Array.from(self.actions.values()).map((action) =>
          action.toTargetEnvContext(),
        )
      },
      hasChildren: self.hasChildren,
      hasSiblings: self.hasSiblings,
      get parent() {
        return self.parent ? self.parent.toTargetEnvContext() : null
      },
      get children() {
        return Array.from(self.children.values()).map((child) =>
          child.toTargetEnvContext(),
        )
      },
      get siblings() {
        return Array.from(self.siblings.values()).map((sibling) =>
          sibling.toTargetEnvContext(),
        )
      },
    }
  }

  /**
   * Processes an incoming outcome that was produced as a result
   * of an action execution on this node.
   * @param outcome The outcome object to process.
   * @throws An error if the outcome is not associated with this node.
   */
  public onOutcome(outcome: ServerExecutionOutcome): void {
    if (outcome.node._id !== this._id) {
      throw new Error(
        `Outcome node ID "${outcome.node._id}" does not match node ID "${this._id}".`,
      )
    }

    // If the outcome was successful, the node is
    // openable, and the action opens the node on
    // success, then mark the node as opened.
    if (
      outcome.status === 'success' &&
      this.openable &&
      outcome.action.opensNode
    ) {
      this._opened = true
    }
  }

  /**
   * Retains necessary properties only (ID, prototype ID, and exclusion status) and
   * converts all other properties to their default values.
   * @returns A ghost node with only the necessary properties.
   */
  public toGhost(): ServerMissionNode {
    return new ServerMissionNode(this.force, {
      _id: this._id,
      prototypeId: this.prototype._id,
      exclude: this.exclude,
    })
  }

  /**
   * Validates the actions of the node.
   * @param actions The actions to validate.
   * @returns True if the actions are valid, false otherwise.
   */
  public static validateActions(actions: TMissionNodeJson['actions']): void {
    let actionKeys: TMissionActionJson['localKey'][] = []

    for (const action of actions) {
      const { processTime, successChance, resourceCost } = action

      // PROCESS TIME
      let isValidNumber = ServerMissionAction.PROCESS_TIME_REGEX.test(
        processTime.toString(),
      )
      if (!isValidNumber) {
        throw generateValidationError(
          `Process time "${processTime}" is not a valid number for action "{ _id: ${action._id}, name: ${action.name} }".`,
        )
      }
      let lessThanMax = processTime <= ServerMissionAction.PROCESS_TIME_MAX
      if (!lessThanMax) {
        throw generateValidationError(
          `Process time "${processTime}" exceeds the maximum process time "${ServerMissionAction.PROCESS_TIME_MAX}" for action "{ _id: ${action._id}, name: ${action.name} }".`,
        )
      }

      // SUCCESS CHANCE
      let betweenZeroAndOne = successChance >= 0 && successChance <= 1
      if (!betweenZeroAndOne) {
        throw generateValidationError(
          `Success chance "${successChance}" is not between 0 and 1 for action "{ _id: ${action._id}, name: ${action.name} }".`,
        )
      }

      // RESOURCE COST
      let nonNegativeInteger = NumberToolbox.isNonNegativeInteger(resourceCost)
      if (!nonNegativeInteger) {
        throw generateValidationError(
          `Resource cost "${resourceCost}" is a negative integer for action "{ _id: ${action._id}, name: ${action.name} }".`,
        )
      }

      // Check for duplicate local keys.
      if (actionKeys.includes(action.localKey)) {
        throw generateValidationError(
          `Duplicate local key "${action.localKey}" found for action "{ _id: ${action._id}, name: ${action.name} }".`,
        )
      }
      actionKeys.push(action.localKey)
    }
  }

  /**
   * The minimum length of the actions in the node data.
   * @note This is used to validate the nodes of the force.
   * @see {@link ServerMissionForce.validateNodes}
   */
  public static readonly ACTIONS_MIN_LENGTH = 1
}
