import ActionExecution from 'metis/missions/actions/executions'
import ServerMissionAction from '.'
import { TServerMissionTypes } from '..'
import { TListenerTargetEmittable, EventManager } from 'metis/events'

/**
 * The execution of an action on the server.
 */
export default class ServerActionExecution
  extends ActionExecution<TServerMissionTypes>
  implements TListenerTargetEmittable<TServerExecutionEvent, []>
{
  /**
   * The event manager for the execution.
   */
  private eventManager: EventManager<TServerExecutionEvent, []>

  /**
   * @param action The action being executed.
   * @param start The time at which the action started executing.
   * @param end The time at which the action finishes executing.
   */
  public constructor(
    action: ServerMissionAction,
    start: number,
    end: number,
    aborted: boolean = false,
  ) {
    super(action, start, end, aborted)

    // Initialize event management.
    this.eventManager = new EventManager(this)
    this.addEventListener = this.eventManager.addEventListener
    this.removeEventListener = this.eventManager.removeEventListener
    this.emitEvent = this.eventManager.emitEvent
  }

  // Overridden
  public abort(): boolean {
    let aborted = super.abort()
    if (aborted) this.emitEvent('aborted')
    return aborted
  }

  // Implemented
  public addEventListener

  // Implemented
  public removeEventListener

  // Implemented
  public emitEvent
}

/* -- TYPES -- */

/**
 * The events that can occur during the
 * execution of a server action.
 */
export type TServerExecutionEvent = 'aborted'
