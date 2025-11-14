import type { TListenerTargetEmittable } from '@shared/events/EventManager'
import { EventManager } from '@shared/events/EventManager'
import type { TExecutionCheats } from '@shared/missions/actions/ActionExecution'
import { ActionExecution } from '@shared/missions/actions/ActionExecution'
import type { TExecutionOutcomeJson } from '@shared/missions/actions/ExecutionOutcome'
import type { TSessionConfig } from '@shared/sessions/MissionSession'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import { ServerExecutionOutcome } from './ServerExecutionOutcome'
import type { ServerMissionAction } from './ServerMissionAction'

/**
 * The execution of an action on the server.
 */
export class ServerActionExecution
  extends ActionExecution<TMetisServerComponents>
  implements TListenerTargetEmittable<TServerExecutionEvent, []>
{
  /**
   * The event manager for the execution.
   */
  private eventManager: EventManager<TServerExecutionEvent, []>

  /**
   * @param _id The ID of the execution.
   * @param action The action being executed.
   * @param start The time at which the action started executing.
   * @param end The time at which the action finishes executing.
   * @param aborted Whether the execution was aborted.
   * @param abortedAt The time at which the execution was aborted,
   * if it was aborted.
   */
  public constructor(
    _id: string,
    action: ServerMissionAction,
    start: number,
    end: number,
    options: TServerExecutionOptions = {},
  ) {
    const { outcomeData = null } = options

    super(_id, action, start, end)

    // Parse outcome data, if present.
    if (outcomeData) {
      this._outcome = ServerExecutionOutcome.loadExisting(outcomeData, this)
    } else {
      this._outcome = null
    }

    // Initialize event management.
    this.eventManager = new EventManager(this)
    this.addEventListener = this.eventManager.addEventListener
    this.removeEventListener = this.eventManager.removeEventListener
    this.emitEvent = this.eventManager.emitEvent
  }

  /**
   * Aborts the execution of the action.
   * @returns Whether the action execution was successfully aborted.
   */
  public abort(): boolean {
    // If currently executing, abort the execution
    // and emit an 'aborted' event.
    if (this.status === 'executing') {
      this._outcome = ServerExecutionOutcome.generateAborted(this)
      this.emitEvent('aborted')
      return true
    } else {
      return false
    }
  }

  // Implemented
  public addEventListener

  // Implemented
  public removeEventListener

  // Implemented
  public emitEvent

  /**
   * Creates a brand new action-execution from the given
   * action.
   * @param action The action to execute.
   * @param cheats Cheats to apply to the execution, if any.
   */
  public static generateExecution(
    action: ServerMissionAction,
    cheats: Partial<TExecutionCheats> = {},
  ): ServerActionExecution {
    // Determine the start and end time of
    // the execution process.
    let start: number = Date.now()
    let end: number = start + action.processTime

    // If the "Instantaneous Execution" cheat is enabled,
    // set the end time to the start time.
    if (cheats.instantaneous) end = start

    // Generate and return the new execution.
    return new ServerActionExecution(
      StringToolbox.generateRandomId(),
      action,
      start,
      end,
    )
  }
}

/* -- TYPES -- */

/**
 * Options for TExecuteOptions.
 */
export type TExecuteOptions = {
  /**
   * The configuration for the session.
   */
  sessionConfig: TSessionConfig
  /**
   * Cheats to apply when executing the action.
   * @note Any cheats ommitted will be treated
   * as `false`, or disabled.
   */
  cheats?: Partial<TExecutionCheats>
  /**
   * Callback for when the action execution process is initated. Passes a timestamp of when the process is expected to conclude and the promise to be resolved.
   */
  onInit?: (execution: ServerActionExecution) => void
}

/**
 * The events that can occur during the
 * execution of a server action.
 */
export type TServerExecutionEvent = 'aborted'

/**
 * Options for constructor `ServerActionExecution`.
 */
export type TServerExecutionOptions = {
  /**
   * Data used to load a pre-existing outcome into
   * the execution.
   * @default null
   */
  outcomeData?: TExecutionOutcomeJson | null
}
