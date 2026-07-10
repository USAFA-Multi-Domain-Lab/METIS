import { ClientEnvironmentTask } from '@client/target-environments/ClientEnvironmentTask'
import { createClientSessionController } from './createClientSessionController'

/**
 * Handles an update to a target-environment task (a hook or an effect)
 * across the setup, teardown, and live phases. The task is reconciled
 * by ID, so an existing entry transitions in place to its new state
 * rather than being duplicated.
 * @param member The client's session member.
 * @param event The event emitted by the server.
 */
export const onTaskUpdate =
  createClientSessionController<'session-task-update'>(
    function (this, member, event) {
      let task = ClientEnvironmentTask.fromJson(event.data.task, this)
      this.upsertTask(task)
      this.logTask(task)
    },
  )
