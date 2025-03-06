import { TMissionActionJson } from 'metis/missions/actions'
import { TActionExecutionJson } from 'metis/missions/actions/executions'
import { TActionOutcomeJson } from 'metis/missions/actions/outcomes'
import MissionNode from 'metis/missions/nodes'
import { TTargetEnvExposedNode } from 'metis/server/target-environments/context'
import { TServerMissionTypes } from '..'
import ServerMissionAction, { TServerMissionActionOptions } from '../actions'
import ServerActionExecution from '../actions/executions'
import { ServerRealizedOutcome } from '../actions/outcomes'

/**
 * Class for managing mission nodes on a session server.
 */
export default class ServerMissionNode extends MissionNode<TServerMissionTypes> {
  // Implemented
  protected importActions(
    data: TMissionActionJson[],
    options: TServerMissionActionOptions = {},
  ): Map<string, ServerMissionAction> {
    let actions: Map<string, ServerMissionAction> = new Map<
      string,
      ServerMissionAction
    >()
    data.forEach((datum) => {
      let action: ServerMissionAction = new ServerMissionAction(
        this,
        datum,
        options,
      )
      actions.set(action._id, action)
    })
    return actions
  }

  // Implemented
  protected importExecutions(
    data: TActionExecutionJson,
  ): ServerActionExecution | null {
    // If data is null return null.
    if (data === null) {
      return null
    }

    // Get action for the ID passed.
    let action: ServerMissionAction | undefined = this.actions.get(
      data.actionId,
    )

    // Handle undefined action.
    if (action === undefined) {
      throw new Error('Action not found for given execution datum.')
    }

    // Return new execution object.
    return new ServerActionExecution(action, data.start, data.end)
  }

  // Implemented
  protected importOutcomes(
    data: TActionOutcomeJson[],
  ): ServerRealizedOutcome[] {
    // Map JSON to an Array of outcome objects.
    return data.map((datum: TActionOutcomeJson) => {
      // Get action for ID passed.
      let action: ServerMissionAction | undefined = this.actions.get(
        datum.actionId,
      )

      // Handle undefined action.
      if (action === undefined) {
        throw new Error('Action not found for given outcome datum.')
      }

      // Return new outcome object.
      return new ServerRealizedOutcome(action, datum.status)
    })
  }

  // Implemented
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
  public loadExecution(
    data: NonNullable<TActionExecutionJson>,
  ): ServerActionExecution {
    // Get the action action being executed.
    let { actionId } = data
    let action = this.actions.get(actionId)

    // Throw an error if action is undefined.
    if (action === undefined) {
      throw new Error(
        'Action not found for given the action ID in the execution data.',
      )
    }
    // Throw an error if not executable.
    if (!this.executable) {
      throw new Error('Cannot handle execution: Node is not executable.')
    }
    // Throw an error if non ready to execute.
    if (!this.readyToExecute) {
      throw new Error('Cannot handle execution: Node is not ready to execute.')
    }

    // Generate and set the node's execution.
    this._execution = new ServerActionExecution(
      action,
      data.start,
      data.end,
      data.aborted,
    )

    // Return execution.
    return this._execution
  }

  // Implemented
  public loadOutcome(data: TActionOutcomeJson): ServerRealizedOutcome {
    // Get the action for the outcome.
    let action: ServerMissionAction | undefined = this.actions.get(
      data.actionId,
    )

    // Throw an error if action is undefined.
    if (action === undefined) {
      throw new Error(
        'Action not found for given the action ID in the outcome data.',
      )
    }
    // Throw an error if the execution state is not executed.
    if (this.executionState !== 'executing') {
      throw new Error('Cannot handle outcome: Node is not executing.')
    }

    // Generate outcome.
    let outcome: ServerRealizedOutcome = new ServerRealizedOutcome(
      action,
      data.status,
    )

    // Add to list of outcomes.
    this._outcomes.push(outcome)

    // Remove execution.
    this._execution = null

    // If the outcome was successful, the node is
    // openable, and the action opens the node on
    // success, then mark the node as opened.
    if (outcome.status === 'success' && this.openable && action.opensNode) {
      this._opened = true
    }

    // Return outcome.
    return outcome
  }

  // Implemented
  public updateBlockStatus(blocked: boolean): void {
    // Set blocked.
    this._blocked = blocked

    // Abort the execution, if present.
    if (this.execution) {
      this.execution.abort()
      this._execution = null
    }

    // If the node is open and has children,
    // update the block status for children.
    if (this.opened && this.hasChildren) {
      this.updateBlockStatusForChildren(blocked)
    }
  }

  // Implemented
  protected updateBlockStatusForChildren(
    blocked: boolean,
    node: ServerMissionNode = this,
  ): void {
    // Handle blocking of children.
    node.children.forEach((child) => {
      child.updateBlockStatus(blocked)

      if (child.opened && child.hasChildren) {
        child.updateBlockStatusForChildren(blocked, child)
      }
    })
  }

  // Implemented
  public modifySuccessChance(successChanceOperand: number): void {
    this.actions.forEach((action) => {
      action.modifySuccessChance(successChanceOperand)
    })
  }

  // Implemented
  public modifyProcessTime(processTimeOperand: number): void {
    this.actions.forEach((action) => {
      action.modifyProcessTime(processTimeOperand)
    })
  }

  // Implemented
  public modifyResourceCost(resourceCostOperand: number): void {
    this.actions.forEach((action) => {
      action.modifyResourceCost(resourceCostOperand)
    })
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
}
