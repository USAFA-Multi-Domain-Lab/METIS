import {
  TExecutionFailed,
  TExecutionFailedJson,
} from '../../../../../shared/missions/forces/outputs/execution-failed'

/**
 * An output that's displayed in a force's output panel when an action has been executed unsuccessfully.
 */
export default class ClientExecutionFailedOutput implements TExecutionFailed {
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
   * @param data The execution failed output data from which to create the execution failed output.
   */
  public constructor(data: Required<TExecutionFailedJson>) {
    this._id = data._id
    this.forceId = data.forceId
    this.type = data.type
    this.username = data.username
    this.nodeName = data.nodeName
    this.message = data.message
    this.time = data.time
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
