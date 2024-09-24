import {
  TExecutionSucceeded,
  TExecutionSucceededJson,
} from '../../../../../shared/missions/forces/outputs/execution-succeeded'

/**
 * An output that's displayed in a force's output panel when an action has been executed successfully.
 */
export default class ClientExecutionSucceededOutput
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
   * @param data The execution succeeded output data from which to create the execution succeeded output.
   */
  public constructor(data: Required<TExecutionSucceededJson>) {
    this._id = data._id
    this.forceId = data.forceId
    this.type = data.type
    this.username = data.username
    this.nodeName = data.nodeName
    this.message = data.message
    this.time = data.time
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
