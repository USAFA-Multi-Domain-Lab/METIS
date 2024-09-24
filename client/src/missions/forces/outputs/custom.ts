import {
  TCustom,
  TCustomJson,
} from '../../../../../shared/missions/forces/outputs/custom'

/**
 * An output that's displayed in a force's output panel with a custom message.
 */
export default class ClientCustomOutput implements TCustom {
  // Implemented
  public readonly _id: TCustom['_id']
  // Implemented
  public readonly forceId: TCustom['forceId']
  // Implemented
  public readonly type: TCustom['type']
  // Implemented
  public readonly username: TCustom['username']
  // Implemented
  public readonly message: TCustom['message']
  // Implemented
  public readonly time: TCustom['time']

  /**
   * @param data The custom output data from which to create the custom output.
   */
  public constructor(data: Required<TCustomJson>) {
    this._id = data._id
    this.forceId = data.forceId
    this.type = data.type
    this.username = data.username
    this.message = data.message
    this.time = data.time
  }

  // Implemented
  public toJson(): TCustomJson {
    return {
      _id: this._id,
      forceId: this.forceId,
      type: this.type,
      username: this.username,
      message: this.message,
      time: this.time,
    }
  }
}
