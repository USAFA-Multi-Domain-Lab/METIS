import type { ServerActionExecution } from '@server/missions/actions/ServerActionExecution'
import type { ServerMissionAction } from '@server/missions/actions/ServerMissionAction'
import { ServerEmittedError } from '@shared/connect/errors/ServerEmittedError'
import { createServerSessionController } from './createServerSessionController'

/**
 * Called when a member requests to execute an action on a node.
 * @param member The member requesting to execute an action.
 * @param event The event emitted by the member.
 * @resolves When the action has been executed or a client error is found.
 */
export const onRequestExecuteAction =
  createServerSessionController<'request-execute-action'>(
    async function (this, member, event) {
      // Gather data.
      let { config } = this
      let { actionId, cheats = {} } = event.data
      // Retrieve the realm before any asynchronous operations,
      // since the member could switch realms while the action
      // is executing.
      let realm = member.subscribedRealm
      let action: ServerMissionAction | undefined = realm.getAction(actionId)
      let request = member.buildResponseRequestData(event)

      // Clear the cheats if the member is not authorized
      // to use them.
      if (!member.isAuthorized('cheats')) cheats = {}

      // If the member doesn't have the permission
      // to manipulate nodes, then emit an error.
      if (!member.isAuthorized('manipulateNodes')) {
        return member.emitError(
          new ServerEmittedError(
            ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
            {
              request,
            },
          ),
        )
      }

      // If the session is not in the 'started' state,
      // then emit an error.
      if (this.state !== 'started') {
        return member.emitError(
          new ServerEmittedError(
            ServerEmittedError.CODE_SESSION_CONFLICTING_STATE,
            {
              request,
            },
          ),
        )
      }
      // If the action is undefined, then emit
      // an error.
      if (action === undefined) {
        return member.emitError(
          new ServerEmittedError(ServerEmittedError.CODE_ACTION_NOT_FOUND, {
            request,
          }),
        )
      }
      // If the member doesn't belong to the action's force and doesn't
      // have complete visibility, then emit an error.
      if (
        !member.isAuthorized('completeVisibility') &&
        member.assignedForceId !== action.force._id
      ) {
        return member.emitError(
          new ServerEmittedError(
            ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
            {
              request,
            },
          ),
        )
      }
      // If the action is not executable, then
      // emit an error.
      if (!action.node.executable) {
        return member.emitError(
          new ServerEmittedError(ServerEmittedError.CODE_NODE_NOT_EXECUTABLE, {
            request,
          }),
        )
      }
      // If the node is not revealed, then
      // emit an error.
      if (!action.node.revealed) {
        return member.emitError(
          new ServerEmittedError(ServerEmittedError.CODE_NODE_NOT_REVEALED, {
            request,
          }),
        )
      }
      // If the participant does not have enough
      // resources to execute the action, then
      // emit an error.
      if (!this.areEnoughResources(action, cheats)) {
        return member.emitError(
          new ServerEmittedError(
            ServerEmittedError.CODE_ACTION_INSUFFICIENT_RESOURCES,
            {
              request,
            },
          ),
        )
      }
      // If the action has exceeded its maximum
      // number of executions, then emit an error.
      if (action.executionLimitReached) {
        return member.emitError(
          new ServerEmittedError(
            ServerEmittedError.CODE_ACTION_EXECUTION_LIMIT,
            {
              request,
            },
          ),
        )
      }

      try {
        // Execute the action, awaiting result.
        let outcome = await action.execute({
          sessionConfig: config,
          realmId: realm._id,
          cheats,
          onInit: (execution: ServerActionExecution) =>
            this.onExecution(member, request, execution, realm),
        })

        // Handle the outcome of the action.
        this.onOutcome(member, request, outcome, realm)
      } catch (error) {
        // Emit an error if the action could not be executed.
        member.emitError(
          new ServerEmittedError(ServerEmittedError.CODE_SERVER_ERROR, {
            request: member.buildResponseRequestData(event),
            message: 'Failed to execute action.',
          }),
        )
      }
    },
  )
