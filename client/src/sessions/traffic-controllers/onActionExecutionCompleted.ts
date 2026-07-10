import { ClientExecutionOutcome } from '@client/missions/actions/ClientExecutionOutcome'
import type { TExecutionOutcomeJson } from '@shared/missions/actions/ExecutionOutcome'
import { createClientSessionController } from './createClientSessionController'

/**
 * Handles when action execution has been completed.
 * @param member The client's session member.
 * @param event The event emitted by the server.
 */
export const onActionExecutionCompleted =
  createClientSessionController<'action-execution-completed'>(
    function (this, member, event) {
      // Gather data.
      const { structure, revealedDescendants, revealedDescendantPrototypes } =
        event.data

      const outcomeData: TExecutionOutcomeJson = event.data.outcome
      const { executionId } = outcomeData
      const execution = this.subscribedMission.getExecution(executionId)
      if (!execution) {
        return console.error(`Execution "${executionId}" could not be found.`)
      }
      const { node } = execution
      const { prototype } = node

      const outcome = new ClientExecutionOutcome(
        outcomeData._id,
        outcomeData.state,
        execution,
      )

      // Handle outcome on different levels.
      execution.onOutcome(outcome)
      prototype.onOpen(revealedDescendantPrototypes, structure)
      node.onOpen(revealedDescendants)

      node.emitEvent('exec-state-change')

      // Remap actions if there are revealed nodes, since
      // those revealed nodes may contain new actions.
      if (revealedDescendants) this.subscribedRealm.mapActions()

      // Remove execution from active executions.
      this._activeExecutions = this._activeExecutions.filter(
        ({ _id }) => executionId !== _id,
      )
    },
  )
