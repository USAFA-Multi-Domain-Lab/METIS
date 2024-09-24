import { v4 as generateHash } from 'uuid'
import { TServerMissionTypes } from '../..'
import {
  TExecutionStarted,
  TExecutionStartedJson,
} from '../../../../shared/missions/forces/outputs/execution-started'
import ServerUser from '../../../users'
import ServerMissionAction from '../../actions'
import ServerActionExecution from '../../actions/executions'

/**
 * An output that's displayed in a force's output panel when an action has started executing.
 */
export default class ServerExecutionStartedOutput
  implements TExecutionStarted<TServerMissionTypes>
{
  // Implemented
  public readonly _id: TExecutionStarted['_id']
  // Implemented
  public readonly forceId: TExecutionStarted['forceId']
  // Implemented
  public readonly type: TExecutionStarted['type']
  // Implemented
  public readonly username: TExecutionStarted['username']
  // Implemented
  public readonly nodeId: TExecutionStarted['nodeId']
  // Implemented
  public readonly nodeName: TExecutionStarted['nodeName']
  // Implemented
  public readonly actionName: TExecutionStarted['actionName']
  // Implemented
  public readonly processTime: TExecutionStarted['processTime']
  // Implemented
  public readonly successChance: TExecutionStarted['successChance']
  // Implemented
  public readonly resourceCost: TExecutionStarted['resourceCost']
  // Implemented
  public readonly time: TExecutionStarted['time']
  // Implemented
  public readonly execution: ServerActionExecution

  /**
   * @param action The action that is being executed.
   * @param user The user who is the source of the output.
   * @param execution The current execution in process on the node by an action.
   */
  public constructor(
    action: ServerMissionAction,
    user: ServerUser,
    execution: ServerActionExecution,
  ) {
    this._id = generateHash()
    this.forceId = action.force._id
    this.type = 'execution-started'
    this.username = user.username
    this.nodeId = action.node._id
    this.nodeName = action.node.name
    this.actionName = action.name
    this.processTime = action.processTime
    this.successChance = action.successChance
    this.resourceCost = action.resourceCost
    this.time = Date.now()
    this.execution = execution
  }

  // Implemented
  public toJson(): TExecutionStartedJson {
    return {
      _id: this._id,
      forceId: this.forceId,
      type: this.type,
      username: this.username,
      nodeId: this.nodeId,
      nodeName: this.nodeName,
      actionName: this.actionName,
      processTime: this.processTime,
      successChance: this.successChance,
      resourceCost: this.resourceCost,
      time: this.time,
      execution: this.execution.toJson(),
    }
  }
}
