import { TMetisClientComponents } from 'src'
import ClientMissionAction from '.'
import {
  EventManager,
  TListenerTargetEmittable,
} from '../../../../shared/events'
import ActionExecution from '../../../../shared/missions/actions/executions'
import { TExecutionOutcomeJson } from '../../../../shared/missions/actions/outcomes'
import ClientExecutionOutcome from './outcomes'

/**
 * The execution of an action on the client.
 */
export default class ClientActionExecution
  extends ActionExecution<TMetisClientComponents>
  implements TListenerTargetEmittable<TExecutionEvent>
{
  /**
   * Time remaining for the action to complete, formatted
   * for display.
   */
  public get timeRemainingFormatted(): string {
    let timeRemainingFormatted: string = ''
    let timeRemaining: number = this.timeRemaining
    let minutes: number = Math.floor(timeRemaining / 1000 / 60)
    let seconds: number = Math.floor((timeRemaining / 1000) % 60)
    let milliseconds: number = timeRemaining % 1000

    if (timeRemaining === 0) {
      return '00:00:00'
    }

    if (minutes < 10) {
      timeRemainingFormatted += '0'
    }
    timeRemainingFormatted += `${minutes}:`

    if (seconds < 10) {
      timeRemainingFormatted += '0'
    }
    timeRemainingFormatted += `${seconds}`

    timeRemainingFormatted += ':'

    if (milliseconds < 100) {
      timeRemainingFormatted += '0'
    }
    if (milliseconds < 10) {
      timeRemainingFormatted += '0'
    }

    timeRemainingFormatted += `${milliseconds}`

    // Return the formatted time remaining.
    return timeRemainingFormatted
  }

  /**
   * Manages events for the action execution.
   */
  private eventManager: EventManager<TExecutionEvent>

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
    action: ClientMissionAction,
    start: number,
    end: number,
    options: TClientExecutionOptions = {},
  ) {
    const { outcomeData = null } = options

    super(_id, action, start, end)

    // Parse outcome data, if present.
    if (outcomeData) {
      this._outcome = new ClientExecutionOutcome(
        outcomeData._id,
        outcomeData.state,
        this,
      )
    } else {
      this._outcome = null
    }

    // Set up event management.
    this.eventManager = new EventManager(this)
    this.addEventListener = this.eventManager.addEventListener
    this.removeEventListener = this.eventManager.removeEventListener
    this.emitEvent = this.eventManager.emitEvent

    // Initiate ticking.
    this.tick()
  }

  /**
   * Emits 'countdown' events rapidly, until the time remaining
   * reaches zero.
   * @param firstCall Internally used. Do not pass custom value.
   */
  private tick(firstCall: boolean = true): void {
    // Emit a 'tick' event.
    if (!firstCall) this.emitEvent('countdown')

    // Set a timeout to call recursively until
    // the time runs out.
    setTimeout(() => {
      if (this.timeRemaining) this.tick(false)
      // Emit a 'countdown' event if the time
      // remaining reaches zero.
      else if (!firstCall) this.emitEvent('countdown')
    }, 10)
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
 * Events that can be emitted by a `ClientActionExecution`
 * object.
 * @option 'activity'
 * Triggered when any event occurs.
 * @option 'countdown'
 * Triggered rapidly when `timeRemaining` is counting down.
 * This is useful when displaying the time remaining to the
 * user in a React component.
 */
export type TExecutionEvent = 'activity' | 'countdown'

/**
 * Options for constructor `ClientActionExecution`.
 */
export type TClientExecutionOptions = {
  /**
   * Data used to load a pre-existing outcome into
   * the execution.
   * @default null
   */
  outcomeData?: TExecutionOutcomeJson | null
}
