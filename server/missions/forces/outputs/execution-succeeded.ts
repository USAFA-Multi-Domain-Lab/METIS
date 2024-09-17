import { v4 as generateHash } from 'uuid'
import {
  TExecutionSucceeded,
  TExecutionSucceededJson,
} from '../../../../shared/missions/forces/outputs/execution-succeeded'
import ServerUser from '../../../users'
import ServerMissionAction from '../../actions'

/**
 * An output that's displayed in a force's output panel when an action has been executed successfully.
 */
export default class ServerExecutionSucceededOutput
  implements TExecutionSucceeded
{
  // Implemented
  public readonly _id: TExecutionSucceeded['_id']
  // Implemented
  public readonly forceId: TExecutionSucceeded['forceId']
  // Implemented
  public readonly type: TExecutionSucceeded['type']
  // Implemented
  public readonly username: TExecutionSucceeded['username']
  // Implemented
  public readonly nodeName: TExecutionSucceeded['nodeName']
  // Implemented
  public readonly message: TExecutionSucceeded['message']
  // Implemented
  public readonly time: TExecutionSucceeded['time']

  /**
   * @param action The action that was executed.
   * @param user The user who is the source of the output.
   */
  public constructor(action: ServerMissionAction, user: ServerUser) {
    this._id = generateHash()
    this.forceId = action.force._id
    this.type = 'execution-succeeded'
    this.username = user.username
    this.nodeName = action.node.name
    this.message = action.postExecutionSuccessText
    this.time = Date.now()
  }

  // Implemented
  public toJson(): TExecutionSucceededJson {
    return {
      _id: this._id,
      forceId: this.forceId,
      type: this.type,
      username: this.username,
      nodeName: this.nodeName,
      message: this.message,
      time: this.time,
    }
  }
}
