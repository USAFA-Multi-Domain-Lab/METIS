import type { TCreateNewOptions } from '@shared/sessions/realms/SessionRealm'
import { SessionRealm } from '@shared/sessions/realms/SessionRealm'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import { ServerMission } from '../missions/ServerMission'
import type { SessionServer } from './SessionServer'

/**
 * Server-side representation of a session realm.
 */
export class ServerSessionRealm extends SessionRealm<TMetisServerComponents> {
  /**
   * @param _id The unique ID of the realm.
   * @param name A human-readable name for the realm.
   * @param session The session to which the realm belongs.
   * @param mission The realm's own copy of the mission.
   */
  public constructor(
    _id: string,
    name: string,
    session: SessionServer,
    mission: ServerMission,
  ) {
    super(_id, name, session, mission)
  }

  /**
   * Creates a new {@link ServerSessionRealm} with a random ID.
   * @param name A human-readable name for the realm.
   * @param session The session to which the realm belongs.
   * @param options Additional options for creating a new realm.
   */
  public static createNew(
    name: string,
    session: SessionServer,
    options: TCreateNewOptions<TMetisServerComponents> = {},
  ): ServerSessionRealm {
    const {
      mission = ServerMission.createNew(),
      _id = StringToolbox.generateRandomId(),
    } = options
    return new ServerSessionRealm(_id, name, session, mission)
  }
}
