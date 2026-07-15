import { MetisComponent } from '@shared/MetisComponent'
import type { TSessionRealmBasicJson } from '@shared/sessions/SessionRealm'

/**
 * A shallow, mission-free representation of a realm, used to populate
 * realm-switching UI without loading each realm's full mission.
 */
export class SessionRealmBasic
  extends MetisComponent
  implements TSessionRealmBasicJson
{
  // Implemented
  public memberCount: number

  public constructor(data: TSessionRealmBasicJson) {
    super(data._id, data.name, false)

    // Parse the data.
    this.memberCount = data.memberCount
  }

  /**
   * Converts the realm summary back to its JSON representation.
   * @returns A basic JSON representation of the realm.
   */
  public toJson(): TSessionRealmBasicJson {
    return {
      _id: this._id,
      name: this.name,
      memberCount: this.memberCount,
    }
  }
}
