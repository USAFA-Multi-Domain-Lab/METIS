import type { TMetisClientComponents } from '@client/index'
import { ActionExecution } from '@shared/missions/actions/ActionExecution'
import type { TExecutionOutcomeJson } from '@shared/missions/actions/ExecutionOutcome'
import { ClientExecutionOutcome } from './ClientExecutionOutcome'
import { ClientMissionAction } from './ClientMissionAction'

/**
 * The execution of an action on the client.
 */
export class ClientActionExecution extends ActionExecution<TMetisClientComponents> {
  /**
   * The formatted success chance to display to a session
   * member. This uses the effective success chance at the
   * time of execution, not the current success chance of
   * the action.
   * @see {@link effectiveSuccessChance}
   */
  public get successChanceFormatted(): string {
    return ClientMissionAction.formatSuccessChance(
      this.effectiveSuccessChance,
      this.action.successChanceHidden,
    )
  }
  /**
   * The formatted process time to display to a session
   * member. This uses the effective process time at the
   * time of execution, not the current process time of
   * the action.
   * @see {@link effectiveProcessTime}
   */
  public get processTimeFormatted(): string {
    return ClientMissionAction.formatProcessTime(
      this.effectiveProcessTime,
      this.action.processTimeHidden,
    )
  }

  /**
   * Time remaining for the action to complete, formatted
   * for display.
   */
  public get timeRemainingFormatted(): string {
    let timeRemaining = this.timeRemaining

    if (timeRemaining === 0) {
      return '00:00:00'
    }

    let minutes = Math.floor(timeRemaining / 60000)
    let seconds = Math.floor((timeRemaining % 60000) / 1000)
    let milliseconds = timeRemaining % 1000

    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}:${milliseconds.toString().padStart(3, '0')}`
  }

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
  }
}

/* -- TYPES -- */

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
