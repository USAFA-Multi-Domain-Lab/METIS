import { v4 as generateHash } from 'uuid'
import {
  TPreExecution,
  TPreExecutionJson,
} from '../../../../shared/missions/forces/outputs/pre-execution'
import ServerUser from '../../../users'
import ServerMissionNode from '../../nodes'

/**
 * An output that's displayed in a force's output panel for a node that has not had any actions executed on it yet.
 */
export default class ServerPreExecutionOutput implements TPreExecution {
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
   * @param node The node containing the pre-execution text.
   * @param user The user who is the source of the output.
   */
  public constructor(node: ServerMissionNode, user: ServerUser) {
    this._id = generateHash()
    this.forceId = node.force._id
    this.type = 'pre-execution'
    this.username = user.username
    this.nodeName = node.name
    this.message = node.preExecutionText
    this.time = Date.now()
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
