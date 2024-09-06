import ClientMissionAction from '.'
import { TClientMissionTypes } from '..'
import IActionExecution, {
  TActionExecutionJson,
} from '../../../../shared/missions/actions/executions'
import ClientMissionNode from '../nodes'

/**
 * The execution of an action on the client.
 */
export default class ClientActionExecution
  implements IActionExecution<TClientMissionTypes>
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
  get timeRemaining(): number {
    let executionTimeEnd: number = this.end
    let now: number = Date.now()

    if (executionTimeEnd < now) {
      return 0
    } else {
      return executionTimeEnd - now
    }
  }

  /**
   * The seconds remaining for the action to complete.
   */
  get secondsRemaining(): number {
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
   * @param action The action being executed.
   * @param start The time at which the action started executing.
   * @param end The time at which the action finishes executing.
   */
  public constructor(action: ClientMissionAction, start: number, end: number) {
    this.action = action
    this.start = start
    this.end = end
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
   * Formats the time remaining for the action to complete.
   * @param includeMilliseconds Whether to include milliseconds in the time remaining.
   * @returns The formatted time remaining.
   */
  formatTimeRemaining(includeMilliseconds: boolean): string {
    let timeRemainingFormatted: string = ''
    let timeRemaining: number = includeMilliseconds
      ? this.timeRemaining
      : this.secondsRemaining * 1000
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

    if (includeMilliseconds) {
      timeRemainingFormatted += ':'

      if (milliseconds < 100) {
        timeRemainingFormatted += '0'
      }
      if (milliseconds < 10) {
        timeRemainingFormatted += '0'
      }

      timeRemainingFormatted += `${milliseconds}`
    }

    // Return the formatted time remaining.
    return timeRemainingFormatted
  }
}
