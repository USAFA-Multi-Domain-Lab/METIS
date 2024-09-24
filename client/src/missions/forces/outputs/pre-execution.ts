import {
  TPreExecution,
  TPreExecutionJson,
} from '../../../../../shared/missions/forces/outputs/pre-execution'

/**
 * An output that's displayed in a force's output panel for a node that has not had any actions executed on it yet.
 */
export default class ClientPreExecutionOutput implements TPreExecution {
  // Implemented
  public readonly _id: TPreExecution['_id']
  // Implemented
  public readonly forceId: TPreExecution['forceId']
  // Implemented
  public readonly type: TPreExecution['type']
  // Implemented
  public readonly username: TPreExecution['username']
  // Implemented
  public readonly nodeName: TPreExecution['nodeName']
  // Implemented
  public readonly message: TPreExecution['message']
  // Implemented
  public readonly time: TPreExecution['time']

  /**
   * @param data The pre-execution output data from which to create the pre-execution output.
   */
  public constructor(data: Required<TPreExecutionJson>) {
    this._id = data._id
    this.forceId = data.forceId
    this.type = data.type
    this.username = data.username
    this.nodeName = data.nodeName
    this.message = data.message
    this.time = data.time
  }

  // Implemented
  public toJson(): TPreExecutionJson {
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
