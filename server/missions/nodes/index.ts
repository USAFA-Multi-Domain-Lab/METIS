import { TMissionActionJson } from 'metis/missions/actions'
import { TActionExecutionJson } from 'metis/missions/actions/executions'
import MissionNode from 'metis/missions/nodes'
import { TMetisServerComponents } from 'metis/server'
import { TTargetEnvExposedNode } from 'metis/server/target-environments/context'
import ServerMissionAction from '../actions'
import ServerActionExecution from '../actions/executions'
import ServerExecutionOutcome from '../actions/outcomes'

/**
 * Class for managing mission nodes on a session server.
 */
export default class ServerMissionNode extends MissionNode<TMetisServerComponents> {
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
   * Opens the node.
   * @returns a promise that resolves when the node opening has been fulfilled.
   */
  public open(): Promise<void> {
    return new Promise<void>(
      (resolve: () => void, reject: (error: Error) => void) => {
        if (this.openable) {
          this._opened = true
          resolve()
        } else {
          reject(new Error('Node is not openable.'))
        }
      },
    )
  }

  // Implemented
  public updateBlockStatus(blocked: boolean): void {
    // Blocks this node and all of its revealed descendants.
    const algorithm = (blocked: boolean, node: ServerMissionNode = this) => {
      node._blocked = blocked
      // Abort execution, if executing.
      if (node.executing) node.latestExecution!.abort()
      node.revealedDescendants.forEach((descendant) => {
        algorithm(blocked, descendant)
      })
    }

    // Set the block status.
    algorithm(blocked)
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
}
