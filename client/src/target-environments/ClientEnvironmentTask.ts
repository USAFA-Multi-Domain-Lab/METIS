import type { SessionClient } from '@client/sessions/SessionClient'
import {
  TargetEnvironmentTask,
  type TEnvironmentTaskError,
  type TEnvironmentTaskJson,
} from '@shared/target-environments/TargetEnvironmentTask'
import type { TMetisClientComponents } from '..'
import { ClientTargetEnvironment } from './ClientTargetEnvironment'

/**
 * A client-side target-environment task. It is the read-only counterpart
 * of the server's runnable task: reconstructed from the record broadcast
 * over the wire so authorized members can render a task's lifecycle
 * (queued -> running -> resolved) without the server-only script and
 * context that produced it.
 */
export class ClientEnvironmentTask extends TargetEnvironmentTask<TMetisClientComponents> {
  /**
   * Reconstructs a task from its JSON-serializable representation.
   * @param json The JSON-serializable representation.
   * @param session The session this task belongs to.
   * @param registry The target environment registry from which to
   * retrieve the environment instance.
   */
  public static fromJson(
    json: TEnvironmentTaskJson,
    session: SessionClient,
  ): ClientEnvironmentTask {
    // Gather information.
    let { source, status, error: errorData } = json
    let error: TEnvironmentTaskError | null = null
    let environment = ClientTargetEnvironment.REGISTRY.get(json.environmentId)

    if (session._id !== json.sessionId) {
      throw new Error(
        'The session passed does not match the session ID in the JSON.',
      )
    }
    if (!environment) {
      throw new Error(
        `No target environment with ID "${json.environmentId}" is registered on the client.`,
      )
    }

    // If error data was provided, reconstruct the error.
    if (errorData) {
      error = new Error(errorData.message)
      error.name = errorData.name
      error.stack = errorData.stack
      error.code = errorData.code
    }

    return new ClientEnvironmentTask(
      json._id,
      environment,
      session,
      json.realmName,
      status,
      error,
      source,
    )
  }
}
