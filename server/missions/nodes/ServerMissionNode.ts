import type {
  TActionExecutionJson,
  TMissionActionJson,
  TMissionNodeJson,
} from 'metis/missions'
import { MissionNode } from 'metis/missions'
import { NumberToolbox } from 'metis/toolbox'
import { MetisDatabase } from '../../database'
import type { TTargetEnvExposedNode } from '../../target-environments'
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
   * Extracts the necessary properties from the node to be used as a reference
   * in a target environment.
   * @returns The node's necessary properties.
   */
  public toTargetEnvContext(): TTargetEnvExposedNode {
    return {
      _id: this._id,
      name: this.name,
      description: this.description,
      actions: Array.from(this.actions.values()).map((action) =>
        action.toTargetEnvContext(),
      ),
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
        throw MetisDatabase.generateValidationError(
          `Process time "${processTime}" is not a valid number for action "{ _id: ${action._id}, name: ${action.name} }".`,
        )
      }
      let lessThanMax = processTime <= ServerMissionAction.PROCESS_TIME_MAX
      if (!lessThanMax) {
        throw MetisDatabase.generateValidationError(
          `Process time "${processTime}" exceeds the maximum process time "${ServerMissionAction.PROCESS_TIME_MAX}" for action "{ _id: ${action._id}, name: ${action.name} }".`,
        )
      }

      // SUCCESS CHANCE
      let betweenZeroAndOne = successChance >= 0 && successChance <= 1
      if (!betweenZeroAndOne) {
        throw MetisDatabase.generateValidationError(
          `Success chance "${successChance}" is not between 0 and 1 for action "{ _id: ${action._id}, name: ${action.name} }".`,
        )
      }

      // RESOURCE COST
      let nonNegativeInteger = NumberToolbox.isNonNegativeInteger(resourceCost)
      if (!nonNegativeInteger) {
        throw MetisDatabase.generateValidationError(
          `Resource cost "${resourceCost}" is a negative integer for action "{ _id: ${action._id}, name: ${action.name} }".`,
        )
      }

      // Check for duplicate local keys.
      if (actionKeys.includes(action.localKey)) {
        throw MetisDatabase.generateValidationError(
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
