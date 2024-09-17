import { v4 as generateHash } from 'uuid'
import {
  TExecutionFailed,
  TExecutionFailedJson,
} from '../../../../shared/missions/forces/outputs/execution-failed'
import ServerUser from '../../../users'
import ServerMissionAction from '../../actions'

/**
 * An output that's displayed in a force's output panel when an action has been executed unsuccessfully.
 */
export default class ServerExecutionFailedOutput implements TExecutionFailed {
  // Implemented
  public readonly _id: TExecutionFailed['_id']
  // Implemented
  public readonly forceId: TExecutionFailed['forceId']
  // Implemented
  public readonly type: TExecutionFailed['type']
  // Implemented
  public readonly username: TExecutionFailed['username']
  // Implemented
  public readonly nodeName: TExecutionFailed['nodeName']
  // Implemented
  public readonly message: TExecutionFailed['message']
  // Implemented
  public readonly time: TExecutionFailed['time']

  /**
   * @param action The action that was executed.
   * @param user The user who is the source of the output.
   */
  public constructor(action: ServerMissionAction, user: ServerUser) {
    this._id = generateHash()
    this.forceId = action.force._id
    this.type = 'execution-failed'
    this.username = user.username
    this.nodeName = action.node.name
    this.message = action.postExecutionFailureText
    this.time = Date.now()
  }

  // Implemented
  public toJson(): TExecutionFailedJson {
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
