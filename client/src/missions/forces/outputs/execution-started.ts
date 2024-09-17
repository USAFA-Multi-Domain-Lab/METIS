import ClientMissionForce from '..'
import { TClientMissionTypes } from '../..'
import { TActionExecutionJson } from '../../../../../shared/missions/actions/executions'
import {
  TExecutionStarted,
  TExecutionStartedJson,
} from '../../../../../shared/missions/forces/outputs/execution-started'
import ClientMissionAction from '../../actions'
import ClientActionExecution from '../../actions/executions'

/**
 * An output that's displayed in a force's output panel when an action has started executing.
 */
export default class ClientExecutionStartedOutput
  implements TExecutionStarted<TClientMissionTypes>
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
  public readonly execution: ClientActionExecution | null

  /**
   * @param data The execution started output data from which to create the execution started output.
   */
  public constructor(
    force: ClientMissionForce,
    data: Required<TExecutionStartedJson>,
  ) {
    this._id = data._id
    this.forceId = data.forceId
    this.type = data.type
    this.username = data.username
    this.nodeId = data.nodeId
    this.nodeName = data.nodeName
    this.actionName = data.actionName
    this.processTime = data.processTime
    this.successChance = data.successChance
    this.resourceCost = data.resourceCost
    this.time = data.time
    this.execution = null

    // If there is an execution, create a new action execution object.
    if (data.execution) {
      // Parse the execution data.
      let executionJson: TActionExecutionJson = data.execution
      // Get the action that the execution is for.
      let action: ClientMissionAction | undefined = force.actions.get(
        executionJson.actionId,
      )
      // If the action exists, create a new action execution object.
      if (action) {
        this.execution = new ClientActionExecution(
          action,
          executionJson?.start,
          executionJson?.end,
        )
      }
    }
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
      execution: this.execution?.toJson() ?? null,
    }
  }
}
