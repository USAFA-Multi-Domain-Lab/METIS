import IActionExecution, {
  TActionExecutionJSON,
} from 'metis/missions/actions/executions'
import ServerMissionAction from '.'
import ServerMissionNode from '../nodes'

/**
 * The execution of an action on the server.
 */
export default class ServerActionExecution implements IActionExecution {
  // Implemented
  public readonly action: ServerMissionAction
  // Implemented
  public get node(): ServerMissionNode {
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
   * @param {ServerMissionAction} action The action being executed.
   * @param {number} start The time at which the action started executing.
   * @param {number} end The time at which the action finishes executing.
   */
  public constructor(action: ServerMissionAction, start: number, end: number) {
    this.action = action
    this.start = start
    this.end = end
  }

  // Implemented
  public toJSON(): NonNullable<TActionExecutionJSON> {
    return {
      actionID: this.actionID,
      nodeID: this.nodeID,
      start: this.start,
      end: this.end,
    }
  }
}
