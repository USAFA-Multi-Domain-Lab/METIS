import IActionExecution, {
  TActionExecutionJson,
} from 'metis/missions/actions/executions'
import ServerMissionAction from '.'
import { TServerMissionTypes } from '..'
import ServerMissionNode from '../nodes'

/**
 * The execution of an action on the server.
 */
export default class ServerActionExecution
  implements IActionExecution<TServerMissionTypes>
{
  // Implemented
  public readonly action: ServerMissionAction
  // Implemented
  public get node(): ServerMissionNode {
    return this.action.node
  }
  // Implmented
  public get actionId(): ServerMissionAction['_id'] {
    return this.action._id
  }
  // Implemented
  public get nodeId(): ServerMissionNode['_id'] {
    return this.action.node._id
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
  public toJson(): NonNullable<TActionExecutionJson> {
    return {
      actionId: this.actionId,
      nodeId: this.nodeId,
      start: this.start,
      end: this.end,
    }
  }
}
