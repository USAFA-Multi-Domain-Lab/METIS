import { TListenerTargetEmittable } from 'src/toolbox/hooks'
import ClientMissionAction from '.'
import { TClientMissionTypes } from '..'
import TActionExecution, {
  TActionExecutionJson,
} from '../../../../shared/missions/actions/executions'
import ClientMissionNode from '../nodes'
import EventManager from 'src/events'

/**
 * The execution of an action on the client.
 */
export default class ClientActionExecution
  implements
    TActionExecution<TClientMissionTypes>,
    TListenerTargetEmittable<TExecutionEvent>
{
  // Implemented
  public readonly action: ClientMissionAction

  // Implemented
  public get node(): ClientMissionNode {
    return this.action.node
  }

  // Implmented
  public get actionId(): ClientMissionAction['_id'] {
    return this.action._id
  }

  // Implemented
  public get nodeId(): ClientMissionNode['_id'] {
    return this.action.node._id
  }

  // Implemented
  public readonly start: number

  // Implemented
  public readonly end: number

  /**
   * The total amount of time the action is expected to take to execute.
   */
  public get duration(): number {
    return this.end - this.start
  }

  /**
   * The percentage value of completion for the given execution based on the start and end times.
   */
  public get completionPercentage(): number {
    let duration: number = this.duration
    let end: number = this.end
    let now: number = Date.now()
    let percentRemaining: number = (end - now) / duration
    let percentCompleted: number = 1 - percentRemaining

    if (percentCompleted === Infinity) {
      percentCompleted = 0
    }

    return Math.min(percentCompleted, 1)
  }

  /**
   * The time remaining for the action to complete.
   */
  public get timeRemaining(): number {
    let executionTimeEnd: number = this.end
    let now: number = Date.now()

    if (executionTimeEnd < now) {
      return 0
    } else {
      return executionTimeEnd - now
    }
  }

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
   * The seconds remaining for the action to complete.
   */
  public get secondsRemaining(): number {
    let executionTimeEnd: number = this.end
    let now: number = Date.now()
    let timeRemaining: number = executionTimeEnd - now

    if (executionTimeEnd < now) {
      return 0
    } else if (timeRemaining > 0 && timeRemaining < 1000) {
      return 1
    } else {
      return Math.floor(timeRemaining / 1000)
    }
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
    this.action = action
    this.start = start
    this.end = end
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
