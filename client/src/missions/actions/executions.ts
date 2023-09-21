import ClientMissionAction from '.'
import IActionExecution, {
  TActionExecutionJSON,
} from '../../../../shared/missions/actions/executions'
import ClientMissionNode from '../nodes'

/**
 * The execution of an action on the client.
 */
export default class ClientActionExecution implements IActionExecution {
  // Implemented
  public readonly action: ClientMissionAction
  // Implemented
  public get node(): ClientMissionNode {
    return this.action.node
  }
  // Implmented
  public get actionID(): string {
    return this.action.actionID
  }
  // Implemented
  public get nodeID(): string {
    return this.action.node.nodeID
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
   * @param {ServerMissionAction} action The action being executed.
   * @param {number} start The time at which the action started executing.
   * @param {number} end The time at which the action finishes executing.
   */
  public constructor(action: ClientMissionAction, start: number, end: number) {
    this.action = action
    this.start = start
    this.end = end
  }

  // Implemented
  public toJSON(): TActionExecutionJSON {
    return {
      actionID: this.actionID,
      nodeID: this.nodeID,
      start: this.start,
      end: this.end,
    }
  }
}
