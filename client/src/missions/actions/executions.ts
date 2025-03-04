import { TListenerTargetEmittable } from 'src/toolbox/hooks'
import ClientMissionAction from '.'
import { TClientMissionTypes } from '..'
import TActionExecution, {
  TActionExecutionJson,
} from '../../../../shared/missions/actions/executions'
import EventManager from 'src/events'

/**
 * The execution of an action on the client.
 */
export default class ClientActionExecution
  extends TActionExecution<TClientMissionTypes>
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
  private eventManager: EventManager<TExecutionEvent, []>

  /**
   * @param action The action being executed.
   * @param start The time at which the action started executing.
   * @param end The time at which the action finishes executing.
   */
  public constructor(action: ClientMissionAction, start: number, end: number) {
    super(action, start, end)

    // Set up event management.
    this.eventManager = new EventManager(this)
    this.addEventListener = this.eventManager.addEventListener
    this.removeEventListener = this.eventManager.removeEventListener
    this.emitEvent = this.eventManager.emitEvent

    // Initiate ticking.
    this.tick()
  }

  // Implemented
  public toJson(): TActionExecutionJson {
    return {
      actionId: this.actionId,
      nodeId: this.nodeId,
      start: this.start,
      end: this.end,
    }
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
