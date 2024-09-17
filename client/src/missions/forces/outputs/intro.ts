import {
  TIntro,
  TIntroJson,
} from '../../../../../shared/missions/forces/outputs/intro'

/**
 * An output that's displayed in a force's output panel with an intro message.
 */
export default class ClientIntroOutput implements TIntro {
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
   * @param data The intro output data from which to create the intro output.
   */
  public constructor(data: Required<TIntroJson>) {
    this._id = data._id
    this.forceId = data.forceId
    this.type = data.type
    this.forceName = data.forceName
    this.message = data.message
    this.time = data.time
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
