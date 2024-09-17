import { v4 as generateHash } from 'uuid'
import ServerMissionForce from '..'
import ServerMission from '../..'
import {
  TIntro,
  TIntroJson,
} from '../../../../shared/missions/forces/outputs/intro'

/**
 * An output that's displayed in a force's output panel with an intro message.
 */
export default class ServerIntroOutput implements TIntro {
  // Implemented
  public readonly _id: TIntro['_id']
  // Implemented
  public readonly forceId: TIntro['forceId']
  // Implemented
  public readonly type: TIntro['type']
  // Implemented
  public readonly forceName: TIntro['forceName']
  // Implemented
  public readonly message: TIntro['message']
  // Implemented
  public readonly time: TIntro['time']

  /**
   * @param mission The mission that the force belongs to.
   * @param force The force where the output panel belongs.
   */
  public constructor(mission: ServerMission, force: ServerMissionForce) {
    this._id = generateHash()
    this.forceId = force._id
    this.type = 'intro'
    this.forceName = force.name
    this.message = mission.introMessage
    this.time = Date.now()
  }

  // Implemented
  public toJson(): TIntroJson {
    return {
      _id: this._id,
      forceId: this.forceId,
      type: this.type,
      forceName: this.forceName,
      message: this.message,
      time: this.time,
    }
  }
}
