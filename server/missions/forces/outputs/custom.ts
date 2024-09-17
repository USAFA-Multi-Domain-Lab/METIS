import { v4 as generateHash } from 'uuid'
import {
  TCustom,
  TCustomJson,
} from '../../../../shared/missions/forces/outputs/custom'

/**
 * An output that's displayed in a force's output panel with a custom message.
 */
export default class ServerCustomOutput implements TCustom {
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
   * @param forceId The ID of the force where the output panel belongs.
   * @param username The username of the user who is the source of the output.
   * @param message The custom message to display in the output panel.
   */
  public constructor(
    forceId: TCustom['forceId'],
    username: TCustom['username'],
    message: TCustom['message'],
  ) {
    this._id = generateHash()
    this.forceId = forceId
    this.type = 'custom'
    this.username = username
    this.message = message
    this.time = Date.now()
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
