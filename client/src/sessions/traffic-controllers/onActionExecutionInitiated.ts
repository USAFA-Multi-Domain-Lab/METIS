import { ClientActionExecution } from '@client/missions/actions/ClientActionExecution'
import type { ClientMissionAction } from '@client/missions/actions/ClientMissionAction'
import type { ClientMissionNode } from '@client/missions/nodes/ClientMissionNode'
import type { TActionExecutionJson } from '@shared/missions/actions/ActionExecution'
import { createClientSessionController } from './createClientSessionController'

/**
 * Handles when action execution has been initiated.
 * @param member The client's session member.
 * @param event The event emitted by the server.
 */
export const onActionExecutionInitiated =
  createClientSessionController<'action-execution-initiated'>(
    function (this, member, event) {
      // Extract data.
      const { resourcePools } = event.data
      // Type is defined here below because for some reason
      // there are type issues when I extract it using
      // the destructuring syntax above.
      const executionData: TActionExecutionJson = event.data.execution
      const { actionId } = executionData

      // Find the action and node, given the action ID.
      let action: ClientMissionAction | undefined =
        this.subscribedRealm.getAction(actionId)
      let node: ClientMissionNode

      // Handle action not found.
      if (action === undefined) {
        return console.error(
          `Event "action-execution-initiated" was triggered, but the action with the given actionId ("${actionId}") could not be found.`,
        )
      }

      // Handle action found.
      node = action.node
      // Create a new execution object.
      let execution = new ClientActionExecution(
        executionData._id,
        action,
        executionData.realmId,
        executionData.start,
        executionData.end,
      )

      // Handle execution on the node.
      node.onExecution(execution)

      // Update the resource pools for the force.
      for (let updatedPool of resourcePools) {
        let pool = action.force.getPoolByResourceId(updatedPool.resourceId)
        if (pool && updatedPool.balance !== undefined) {
          pool.balance = updatedPool.balance
        }
      }
      action.force.emitEvent('modify-forces')

      // Add execution to active executions.
      this._activeExecutions.push(execution)
      this.tickActiveExecutions()
    },
  )
